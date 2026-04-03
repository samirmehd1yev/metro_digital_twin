"use client";

import { useEffect, useRef, useCallback } from "react";
import { STATIONS, EDGES } from "@/lib/metro-graph";
import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
  width?: number;
  height?: number;
}

const COORDS: Record<string, { x: number; y: number }> = {
  "icherisheher": { x: 85, y: 210 },
  "sahil": { x: 175, y: 210 },
  "28-may": { x: 268, y: 210 },
  "ganjlik": { x: 350, y: 210 },
  "nariman-narimanov": { x: 428, y: 210 },
  "bakmil": { x: 428, y: 148 },
  "ulduz": { x: 502, y: 210 },
  "koroglu": { x: 572, y: 210 },
  "qara-qarayev": { x: 572, y: 263 },
  "neftchiler": { x: 500, y: 263 },
  "xalqlar-dostlugu": { x: 428, y: 263 },
  "ahmadli": { x: 356, y: 263 },
  "hazi-aslanov": { x: 284, y: 263 },
  "nizami": { x: 232, y: 162 },
  "elmler-akademiyasi": { x: 190, y: 122 },
  "inshaatchilar": { x: 148, y: 92 },
  "20-yanvar": { x: 108, y: 72 },
  "memar-ajami": { x: 68, y: 72 },
  "darnagul": { x: 35, y: 72 },
  "8-noyabr": { x: 68, y: 38 },
  "avtovagzal": { x: 108, y: 38 },
  "xocasan": { x: 148, y: 38 },
};

const ABBREVS: Record<string, string> = {
  "icherisheher": "ICS",
  "sahil": "SHL",
  "28-may": "28M",
  "ganjlik": "GNC",
  "nariman-narimanov": "NN",
  "bakmil": "BKM",
  "ulduz": "ULD",
  "koroglu": "KRG",
  "qara-qarayev": "QQ",
  "neftchiler": "NFT",
  "xalqlar-dostlugu": "XD",
  "ahmadli": "AHM",
  "hazi-aslanov": "HA",
  "nizami": "NZM",
  "elmler-akademiyasi": "EA",
  "inshaatchilar": "INS",
  "20-yanvar": "20Y",
  "memar-ajami": "MA",
  "darnagul": "DRN",
  "8-noyabr": "8NY",
  "avtovagzal": "AVT",
  "xocasan": "XCS",
};

const LINE_COLORS: Record<string, string> = {
  red: "#C04040",
  green: "#1D9E75",
  purple: "#7F77DD",
  shared: "#C04040",
};

interface LocalAgent {
  edgeIdx: number;
  progress: number;
  speed: number;
}

function loadColor(load: number): string {
  if (load >= 90) return "#ef4444";
  if (load >= 75) return "#f97316";
  if (load >= 60) return "#f59e0b";
  return "#10b981";
}

function getStationLoad(simState: SimState | null, id: string): number {
  if (!simState) return 0;
  const s = simState.stations.find((st) => st.id === id);
  return s?.load ?? 0;
}

export default function MetroMap({ simState, scenario, width = 660, height = 305 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<LocalAgent[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: width, h: height, scale: 1 });
  const simStateRef = useRef(simState);
  const scenarioRef = useRef(scenario);

  // Keep refs in sync
  simStateRef.current = simState;
  scenarioRef.current = scenario;

  const initAgents = useCallback((count: number) => {
    const agents: LocalAgent[] = [];
    for (let i = 0; i < count; i++) {
      agents.push({
        edgeIdx: Math.floor(Math.random() * EDGES.length),
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
      });
    }
    agentsRef.current = agents;
  }, []);

  // Handle resize
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const scale = rect.width / width;
      sizeRef.current = { w: rect.width, h: height * scale, scale };
      canvas.width = rect.width * dpr;
      canvas.height = height * scale * dpr;
      canvas.style.height = `${height * scale}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();
    return () => ro.disconnect();
  }, [width, height]);

  // Adjust agent count
  useEffect(() => {
    const systemLoad = simState
      ? simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length
      : 30;
    const targetCount = Math.max(5, Math.min(80, Math.round(systemLoad * 0.6)));
    if (agentsRef.current.length === 0) {
      initAgents(targetCount);
    } else {
      while (agentsRef.current.length < targetCount) {
        agentsRef.current.push({
          edgeIdx: Math.floor(Math.random() * EDGES.length),
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
        });
      }
      while (agentsRef.current.length > targetCount) {
        agentsRef.current.pop();
      }
    }
  }, [simState, initAgents]);

  // Animation loop — runs once, reads from refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const state = simStateRef.current;
      const scn = scenarioRef.current;
      const { scale } = sizeRef.current;
      // Dark mode: always true since html has class="dark"
      const dark = document.documentElement.classList.contains("dark");

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

      // ── Draw edges ────────────────────────────────────────────
      for (const edge of EDGES) {
        const from = COORDS[edge.from];
        const to = COORDS[edge.to];
        if (!from || !to) continue;

        const isDelay =
          scn === "delay" &&
          ((edge.from === "koroglu" && edge.to === "qara-qarayev") ||
            (edge.from === "qara-qarayev" && edge.to === "koroglu"));

        if (edge.lineType === "shared") {
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const off = 2.5;

          ctx.globalAlpha = 0.13;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = "#C04040";
          ctx.lineWidth = 6;
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.moveTo(from.x + nx * off, from.y + ny * off);
          ctx.lineTo(to.x + nx * off, to.y + ny * off);
          ctx.strokeStyle = "#C04040";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(from.x - nx * off, from.y - ny * off);
          ctx.lineTo(to.x - nx * off, to.y - ny * off);
          ctx.strokeStyle = "#1D9E75";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isDelay) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = "#BA7517";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 5]);
          ctx.globalAlpha = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const color = LINE_COLORS[edge.lineType] || "#888";
          ctx.globalAlpha = 0.13;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 6;
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // ── Draw agents ───────────────────────────────────────────
      const agentColor = dark ? "#85B7EB" : "#185FA5";
      for (const agent of agentsRef.current) {
        agent.progress += agent.speed;
        if (agent.progress >= 1) {
          agent.progress = 0;
          const weights = EDGES.map((e) => {
            const fl = getStationLoad(state, e.from);
            const tl = getStationLoad(state, e.to);
            return 1 + (fl + tl) / 50;
          });
          const total = weights.reduce((a, b) => a + b, 0);
          let r = Math.random() * total;
          for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) { agent.edgeIdx = i; break; }
          }
        }

        const edge = EDGES[agent.edgeIdx % EDGES.length];
        const from = COORDS[edge.from];
        const to = COORDS[edge.to];
        if (!from || !to) continue;

        const x = from.x + (to.x - from.x) * agent.progress;
        const y = from.y + (to.y - from.y) * agent.progress;

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = agentColor;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── Draw stations ─────────────────────────────────────────
      for (const station of STATIONS) {
        const pos = COORDS[station.id];
        if (!pos) continue;
        const load = getStationLoad(state, station.id);
        const color = loadColor(load);
        const r = station.id === "28-may" ? 13 : 10;

        // Load arc
        const arcAngle = (load / 100) * Math.PI * 2;
        if (arcAngle > 0) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 5.5, -Math.PI / 2, -Math.PI / 2 + arcAngle);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.stroke();
        }

        // Circle fill
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = dark ? "#18181b" : "#fff";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 28 May: extra outer ring
        if (station.id === "28-may") {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 9, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.18;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Memar Əcəmi: purple ring
        if (station.id === "memar-ajami") {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 8, 0, Math.PI * 2);
          ctx.strokeStyle = "#7F77DD";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Delay warning rings
        if (scn === "delay" && (station.id === "koroglu" || station.id === "qara-qarayev")) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Abbreviation inside circle
        ctx.fillStyle = dark ? "#c2c0b6" : "#3d3d3a";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ABBREVS[station.id] || "", pos.x, pos.y);

        // Station name outside
        ctx.font = "9px sans-serif";
        ctx.fillStyle = dark ? "#a1a1aa" : "#52525b";
        ctx.textAlign = "center";
        if (pos.y <= 80) {
          ctx.textBaseline = "top";
          ctx.fillText(station.nameAz, pos.x, pos.y + r + 7);
        } else {
          ctx.textBaseline = "bottom";
          ctx.fillText(station.nameAz, pos.x, pos.y - r - 5);
        }

        // Load % badge
        if (load >= 72 && (pos.y === 210 || pos.y === 263)) {
          ctx.font = "bold 9px sans-serif";
          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(`${load}%`, pos.x, pos.y - r - 14);
        }
      }

      // ── Legend ─────────────────────────────────────────────────
      const legendY = 12;
      const legends: Array<{ color: string; label: string }> = [
        { color: "#C04040", label: "Qırmızı xətt" },
        { color: "#1D9E75", label: "Yaşıl xətt" },
        { color: "#7F77DD", label: "Bənövşəyi xətt" },
      ];
      if (scn === "delay") {
        legends.push({ color: "#BA7517", label: "Gecikən qatar" });
      }
      let lx = 10;
      ctx.font = "9px sans-serif";
      for (const lg of legends) {
        ctx.beginPath();
        ctx.arc(lx + 4, legendY, 4, 0, Math.PI * 2);
        ctx.fillStyle = lg.color;
        ctx.fill();
        ctx.fillStyle = dark ? "#a1a1aa" : "#52525b";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(lg.label, lx + 12, legendY);
        lx += ctx.measureText(lg.label).width + 22;
      }

      // ── Annotations ───────────────────────────────────────────
      ctx.font = "8px sans-serif";
      ctx.fillStyle = dark ? "#52525b" : "#a1a1aa";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("28 May: Qırmızı ∩ Yaşıl keçid nöqtəsi", 268, 245);
      ctx.fillText("Shared: 28 May → H.Aslanov", 428, 195);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
    // Only run animation loop once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapperRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
