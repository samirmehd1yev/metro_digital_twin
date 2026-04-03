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

/* ── Canvas coordinates — spread out for readability ─────────────── */
const COORDS: Record<string, { x: number; y: number }> = {
  "icherisheher": { x: 90, y: 340 },
  "sahil": { x: 210, y: 340 },
  "28-may": { x: 360, y: 340 },
  "ganjlik": { x: 490, y: 340 },
  "nariman-narimanov": { x: 610, y: 340 },
  "bakmil": { x: 610, y: 230 },
  "ulduz": { x: 730, y: 340 },
  "koroglu": { x: 850, y: 340 },
  "qara-qarayev": { x: 850, y: 440 },
  "neftchiler": { x: 730, y: 440 },
  "xalqlar-dostlugu": { x: 610, y: 440 },
  "ahmadli": { x: 490, y: 440 },
  "hazi-aslanov": { x: 360, y: 440 },
  "nizami": { x: 310, y: 255 },
  "elmler-akademiyasi": { x: 250, y: 185 },
  "inshaatchilar": { x: 190, y: 130 },
  "20-yanvar": { x: 130, y: 90 },
  "memar-ajami": { x: 70, y: 90 },
  "darnagul": { x: 70, y: 40 },
  "8-noyabr": { x: 130, y: 40 },
  "avtovagzal": { x: 190, y: 40 },
  "xocasan": { x: 260, y: 40 },
};

const ABBREVS: Record<string, string> = {
  "icherisheher": "ICS", "sahil": "SHL", "28-may": "28M",
  "ganjlik": "GNC", "nariman-narimanov": "NN", "bakmil": "BKM",
  "ulduz": "ULD", "koroglu": "KRG", "qara-qarayev": "QQ",
  "neftchiler": "NFT", "xalqlar-dostlugu": "XD", "ahmadli": "AHM",
  "hazi-aslanov": "HA", "nizami": "NZM", "elmler-akademiyasi": "EA",
  "inshaatchilar": "INS", "20-yanvar": "20Y", "memar-ajami": "MA",
  "darnagul": "DRN", "8-noyabr": "8NY", "avtovagzal": "AVT",
  "xocasan": "XCS",
};

const LINE_COLORS = { red: "#E05555", green: "#2ECC88", purple: "#9B8FE8", shared: "#E05555" };
const GLOW_COLORS = { red: "#E0555530", green: "#2ECC8830", purple: "#9B8FE830", shared: "#E0555530" };

interface LocalAgent {
  edgeIdx: number;
  progress: number;
  speed: number;
  size: number;
}

function loadColor(load: number): string {
  if (load >= 90) return "#FF4444";
  if (load >= 75) return "#FF8C00";
  if (load >= 60) return "#FFB800";
  return "#2ECC88";
}

function loadGlow(load: number): string {
  if (load >= 90) return "#FF444440";
  if (load >= 75) return "#FF8C0030";
  if (load >= 60) return "#FFB80025";
  return "#2ECC8820";
}

function getStationLoad(simState: SimState | null, id: string): number {
  if (!simState) return 0;
  return simState.stations.find((st) => st.id === id)?.load ?? 0;
}

export default function MetroMap({ simState, scenario, width = 940, height = 500 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<LocalAgent[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ scale: 1 });
  const simStateRef = useRef(simState);
  const scenarioRef = useRef(scenario);
  const frameRef = useRef(0);

  simStateRef.current = simState;
  scenarioRef.current = scenario;

  const initAgents = useCallback((count: number) => {
    const agents: LocalAgent[] = [];
    for (let i = 0; i < count; i++) {
      agents.push({
        edgeIdx: Math.floor(Math.random() * EDGES.length),
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
        size: 1.5 + Math.random() * 2,
      });
    }
    agentsRef.current = agents;
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const scale = rect.width / width;
      sizeRef.current = { scale };
      canvas.width = rect.width * dpr;
      canvas.height = height * scale * dpr;
      canvas.style.height = `${height * scale}px`;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    const systemLoad = simState
      ? simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length : 30;
    const targetCount = Math.max(8, Math.min(100, Math.round(systemLoad * 0.8)));
    if (agentsRef.current.length === 0) initAgents(targetCount);
    else {
      while (agentsRef.current.length < targetCount)
        agentsRef.current.push({ edgeIdx: Math.floor(Math.random() * EDGES.length), progress: Math.random(), speed: 0.002 + Math.random() * 0.003, size: 1.5 + Math.random() * 2 });
      while (agentsRef.current.length > targetCount) agentsRef.current.pop();
    }
  }, [simState, initAgents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      frameRef.current++;
      const state = simStateRef.current;
      const scn = scenarioRef.current;
      const { scale } = sizeRef.current;
      const dpr = window.devicePixelRatio || 1;
      const pulse = Math.sin(frameRef.current * 0.03) * 0.5 + 0.5;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

      // ── Grid background ───────────────────────────────────────
      ctx.strokeStyle = "#ffffff06";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // ── Draw edges ────────────────────────────────────────────
      for (const edge of EDGES) {
        const from = COORDS[edge.from];
        const to = COORDS[edge.to];
        if (!from || !to) continue;

        const isDelayEdge = scn === "delay" &&
          ((edge.from === "koroglu" && edge.to === "qara-qarayev") ||
            (edge.from === "qara-qarayev" && edge.to === "koroglu"));

        if (isDelayEdge) {
          // Pulsing amber warning line
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = `rgba(255, 140, 0, ${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 8;
          ctx.setLineDash([]); ctx.stroke();

          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = "#FF8C00";
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 6]); ctx.stroke();
          ctx.setLineDash([]);
          continue;
        }

        if (edge.lineType === "shared") {
          const dx = to.x - from.x, dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len, ny = dx / len;
          const off = 3.5;

          // Glow
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = "#E0555518"; ctx.lineWidth = 14; ctx.stroke();

          // Red stripe
          ctx.beginPath();
          ctx.moveTo(from.x + nx * off, from.y + ny * off);
          ctx.lineTo(to.x + nx * off, to.y + ny * off);
          ctx.strokeStyle = LINE_COLORS.red; ctx.lineWidth = 2.5; ctx.globalAlpha = 1; ctx.stroke();

          // Green stripe
          ctx.beginPath();
          ctx.moveTo(from.x - nx * off, from.y - ny * off);
          ctx.lineTo(to.x - nx * off, to.y - ny * off);
          ctx.strokeStyle = LINE_COLORS.green; ctx.lineWidth = 2.5; ctx.stroke();
        } else {
          const color = LINE_COLORS[edge.lineType as keyof typeof LINE_COLORS] || "#888";
          const glow = GLOW_COLORS[edge.lineType as keyof typeof GLOW_COLORS] || "#88888830";
          // Glow
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = glow; ctx.lineWidth = 12; ctx.setLineDash([]); ctx.stroke();
          // Main line
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
        }
      }

      // ── Draw agents (train dots) ──────────────────────────────
      for (const agent of agentsRef.current) {
        agent.progress += agent.speed;
        if (agent.progress >= 1) {
          agent.progress = 0;
          const weights = EDGES.map((e) => 1 + (getStationLoad(state, e.from) + getStationLoad(state, e.to)) / 50);
          const total = weights.reduce((a, b) => a + b, 0);
          let r = Math.random() * total;
          for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { agent.edgeIdx = i; break; } }
        }
        const edge = EDGES[agent.edgeIdx % EDGES.length];
        const from = COORDS[edge.from], to = COORDS[edge.to];
        if (!from || !to) continue;
        const x = from.x + (to.x - from.x) * agent.progress;
        const y = from.y + (to.y - from.y) * agent.progress;

        // Glow
        ctx.beginPath(); ctx.arc(x, y, agent.size + 3, 0, Math.PI * 2);
        ctx.fillStyle = "#85B7EB15"; ctx.fill();
        // Dot
        ctx.beginPath(); ctx.arc(x, y, agent.size, 0, Math.PI * 2);
        ctx.fillStyle = "#85B7EB"; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
      }

      // ── Draw stations ─────────────────────────────────────────
      for (const station of STATIONS) {
        const pos = COORDS[station.id];
        if (!pos) continue;
        const load = getStationLoad(state, station.id);
        const color = loadColor(load);
        const glow = loadGlow(load);
        const isJunction = station.id === "28-may";
        const isPurpleJunction = station.id === "memar-ajami";
        const isDelayStation = scn === "delay" && (station.id === "koroglu" || station.id === "qara-qarayev");
        const r = isJunction ? 18 : 14;

        // Outer glow ring
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 12, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();

        // Load arc (gauge ring)
        if (load > 0) {
          const arcAngle = (load / 100) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 6, -Math.PI / 2, -Math.PI / 2 + arcAngle);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.lineCap = "butt";

          // Gauge background track
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 6, -Math.PI / 2 + arcAngle, -Math.PI / 2 + Math.PI * 2);
          ctx.strokeStyle = "#ffffff0a";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Junction rings
        if (isJunction) {
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 10, 0, Math.PI * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.15 + pulse * 0.1; ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (isPurpleJunction) {
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 9, 0, Math.PI * 2);
          ctx.strokeStyle = "#9B8FE8"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1;
        }

        // Delay warning animation
        if (isDelayStation) {
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 10 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 140, 0, ${0.2 + pulse * 0.3})`;
          ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
        }

        // Station circle — dark fill with colored border
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#0c0c0f"; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

        // Inner ring
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r - 3, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}30`; ctx.lineWidth = 1; ctx.stroke();

        // Abbreviation
        ctx.fillStyle = "#e4e4e7";
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(ABBREVS[station.id] || "", pos.x, pos.y);

        // Station name label with bg
        ctx.font = "9px 'Inter', sans-serif";
        ctx.textAlign = "center";
        const nameY = pos.y <= 100 ? pos.y + r + 14 : pos.y - r - 10;
        ctx.textBaseline = pos.y <= 100 ? "top" : "bottom";
        const nameW = ctx.measureText(station.nameAz).width;
        // Label background
        const bgY = pos.y <= 100 ? nameY - 1 : nameY - 11;
        ctx.fillStyle = "#0c0c0f90";
        ctx.fillRect(pos.x - nameW / 2 - 3, bgY, nameW + 6, 13);
        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(station.nameAz, pos.x, nameY);

        // Load % badge — shown for high load stations
        if (load >= 60) {
          const badgeY = pos.y <= 100 ? pos.y + r + 28 : pos.y - r - 24;
          const badgeText = `${load}%`;
          const tw = ctx.measureText(badgeText).width;
          ctx.font = "bold 10px 'Courier New', monospace";
          // Badge background
          ctx.fillStyle = load >= 90 ? "#FF444430" : load >= 75 ? "#FF8C0025" : "#FFB80020";
          ctx.beginPath();
          ctx.roundRect(pos.x - tw / 2 - 4, badgeY - 7, tw + 8, 14, 3);
          ctx.fill();
          ctx.fillStyle = color;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(badgeText, pos.x, badgeY);
        }
      }

      // ── Legend — top left ─────────────────────────────────────
      const legendItems: Array<{ color: string; label: string }> = [
        { color: LINE_COLORS.red, label: "QIRMIZI XƏTT" },
        { color: LINE_COLORS.green, label: "YAŞIL XƏTT" },
        { color: LINE_COLORS.purple, label: "BƏNÖVŞƏYI XƏTT" },
      ];
      if (scn === "delay") legendItems.push({ color: "#FF8C00", label: "GECİKMƏ ZONASI" });

      let lx = 14;
      ctx.font = "bold 8px 'Courier New', monospace";
      for (const item of legendItems) {
        // LED dot
        ctx.beginPath(); ctx.arc(lx + 4, 14, 4, 0, Math.PI * 2);
        ctx.fillStyle = item.color; ctx.fill();
        ctx.beginPath(); ctx.arc(lx + 4, 14, 6, 0, Math.PI * 2);
        ctx.strokeStyle = `${item.color}40`; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#a1a1aa"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(item.label, lx + 14, 14);
        lx += ctx.measureText(item.label).width + 30;
      }

      // ── Annotations ───────────────────────────────────────────
      ctx.font = "8px 'Courier New', monospace";
      ctx.fillStyle = "#52525b";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      const mayPos = COORDS["28-may"];
      ctx.fillText("JUNCTION: RED ∩ GREEN", mayPos.x, mayPos.y + 30);
      ctx.fillText("SHARED TRUNK: 28M → HA", 610, 320);

      // System status text — top right
      ctx.font = "8px 'Courier New', monospace";
      ctx.textAlign = "right"; ctx.fillStyle = "#52525b";
      ctx.fillText(`SCENARIO: ${scn.toUpperCase()}`, width - 14, 12);
      ctx.fillText(`TICK: ${state?.tick ?? 0}`, width - 14, 24);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapperRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}
