"use client";

import { useEffect, useRef, useCallback } from "react";
import { STATIONS, EDGES } from "@/lib/metro-graph";
import type { SimState, Scenario, ViewMode } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
  viewMode?: ViewMode;
  width?: number;
  height?: number;
  onStationClick?: (id: string) => void;
}

/* ── Canvas coordinates ─────────────────────────────────────────── */
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

const LINE_COLORS: Record<string, string> = { red: "#E05555", green: "#2ECC88", purple: "#9B8FE8", shared: "#E05555" };

/* ── OD Flow pairs ─────────────────────────────────────────────── */
const OD_FLOWS = [
  { from: "icherisheher", to: "28-may", weight: 0.9 },
  { from: "28-may", to: "hazi-aslanov", weight: 0.85 },
  { from: "memar-ajami", to: "28-may", weight: 0.8 },
  { from: "nariman-narimanov", to: "koroglu", weight: 0.7 },
  { from: "ganjlik", to: "qara-qarayev", weight: 0.65 },
  { from: "nizami", to: "ganjlik", weight: 0.6 },
  { from: "sahil", to: "ulduz", weight: 0.55 },
];

/* ── Cascade BFS distances from delay point ────────────────────── */
function computeCascadeDistances(): Record<string, number> {
  const adj: Record<string, string[]> = {};
  for (const edge of EDGES) {
    if (!adj[edge.from]) adj[edge.from] = [];
    if (!adj[edge.to]) adj[edge.to] = [];
    adj[edge.from].push(edge.to);
    adj[edge.to].push(edge.from);
  }
  const dist: Record<string, number> = {};
  const queue = ["koroglu", "qara-qarayev"];
  queue.forEach((s) => (dist[s] = 0));
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const nb of adj[curr] || []) {
      if (dist[nb] === undefined) {
        dist[nb] = dist[curr] + 1;
        queue.push(nb);
      }
    }
  }
  return dist;
}

const CASCADE_DIST = computeCascadeDistances();

interface LocalAgent {
  edgeIdx: number;
  progress: number;
  speed: number;
  size: number;
}

interface ODDot {
  flowIdx: number;
  t: number;
  speed: number;
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

function heatColor(load: number): string {
  if (load >= 90) return "rgba(255,68,68,0.6)";
  if (load >= 75) return "rgba(255,140,0,0.5)";
  if (load >= 60) return "rgba(255,184,0,0.4)";
  if (load >= 40) return "rgba(46,204,136,0.3)";
  return "rgba(46,204,136,0.15)";
}

export default function MetroMap({ simState, scenario, viewMode = "topology", width = 940, height = 500, onStationClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<LocalAgent[]>([]);
  const odDotsRef = useRef<ODDot[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ scale: 1 });
  const simStateRef = useRef(simState);
  const scenarioRef = useRef(scenario);
  const viewModeRef = useRef(viewMode);
  const frameRef = useRef(0);
  const onStationClickRef = useRef(onStationClick);

  simStateRef.current = simState;
  scenarioRef.current = scenario;
  viewModeRef.current = viewMode;
  onStationClickRef.current = onStationClick;

  // Init OD dots
  useEffect(() => {
    if (odDotsRef.current.length === 0) {
      const dots: ODDot[] = [];
      for (let i = 0; i < OD_FLOWS.length; i++) {
        const count = Math.ceil(OD_FLOWS[i].weight * 4);
        for (let j = 0; j < count; j++) {
          dots.push({ flowIdx: i, t: Math.random(), speed: 0.002 + Math.random() * 0.003 });
        }
      }
      odDotsRef.current = dots;
    }
  }, []);

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

  // Click handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { scale } = sizeRef.current;
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      for (const station of STATIONS) {
        const pos = COORDS[station.id];
        if (!pos) continue;
        const dx = mx - pos.x;
        const dy = my - pos.y;
        if (dx * dx + dy * dy < 20 * 20) {
          onStationClickRef.current?.(station.id);
          return;
        }
      }
    };
    canvas.addEventListener("click", handleClick);
    canvas.style.cursor = "pointer";
    return () => canvas.removeEventListener("click", handleClick);
  }, []);

  // Resize
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

  // Agent count
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

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      frameRef.current++;
      const state = simStateRef.current;
      const scn = scenarioRef.current;
      const vMode = viewModeRef.current;
      const { scale } = sizeRef.current;
      const dpr = window.devicePixelRatio || 1;
      const pulse = Math.sin(frameRef.current * 0.03) * 0.5 + 0.5;
      const cascadeWave = (frameRef.current % 300) / 300; // 0→1 wave cycle

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

      if (vMode === "heatmap") {
        // ── HEATMAP MODE ──────────────────────────────────────────
        // Draw heatmap radial gradients at each station
        for (const station of STATIONS) {
          const pos = COORDS[station.id];
          if (!pos) continue;
          const load = getStationLoad(state, station.id);
          const radius = 40 + load * 0.8;
          const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
          grad.addColorStop(0, heatColor(load));
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Draw edges with load-based gradient
        for (const edge of EDGES) {
          const from = COORDS[edge.from];
          const to = COORDS[edge.to];
          if (!from || !to) continue;
          const fl = getStationLoad(state, edge.from);
          const tl = getStationLoad(state, edge.to);
          const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          grad.addColorStop(0, heatColor(fl));
          grad.addColorStop(1, heatColor(tl));
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 8;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.lineCap = "butt";
        }

        // Station circles (simplified for heatmap)
        for (const station of STATIONS) {
          const pos = COORDS[station.id];
          if (!pos) continue;
          const load = getStationLoad(state, station.id);
          const color = loadColor(load);

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = "#0c0c0f";
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#e4e4e7";
          ctx.font = "bold 9px 'Courier New', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ABBREVS[station.id] || "", pos.x, pos.y);

          // Load badge
          ctx.font = "bold 10px 'Courier New', monospace";
          ctx.fillStyle = color;
          ctx.textBaseline = "bottom";
          ctx.fillText(`${load}%`, pos.x, pos.y - 16);
        }

        // Heatmap legend
        ctx.font = "bold 8px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const hLegend = [
          { color: "#2ECC88", label: "LOW <40%" },
          { color: "#FFB800", label: "MED 40-60%" },
          { color: "#FF8C00", label: "HIGH 60-90%" },
          { color: "#FF4444", label: "CRIT >90%" },
        ];
        let hlx = 14;
        for (const item of hLegend) {
          ctx.beginPath();
          ctx.arc(hlx + 4, 14, 4, 0, Math.PI * 2);
          ctx.fillStyle = item.color;
          ctx.globalAlpha = 0.6;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#a1a1aa";
          ctx.fillText(item.label, hlx + 12, 14);
          hlx += ctx.measureText(item.label).width + 28;
        }

      } else {
        // ── TOPOLOGY MODE ─────────────────────────────────────────

        // ── Draw edges ──────────────────────────────────────────
        for (const edge of EDGES) {
          const from = COORDS[edge.from];
          const to = COORDS[edge.to];
          if (!from || !to) continue;

          const isDelayEdge = scn === "delay" &&
            ((edge.from === "koroglu" && edge.to === "qara-qarayev") ||
              (edge.from === "qara-qarayev" && edge.to === "koroglu"));

          if (isDelayEdge) {
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = `rgba(255, 140, 0, ${0.3 + pulse * 0.4})`;
            ctx.lineWidth = 8; ctx.setLineDash([]); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = "#FF8C00"; ctx.lineWidth = 3;
            ctx.setLineDash([10, 6]); ctx.stroke(); ctx.setLineDash([]);
            continue;
          }

          if (edge.lineType === "shared") {
            const dx = to.x - from.x, dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const off = 3.5;
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = "#E0555518"; ctx.lineWidth = 14; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(from.x + nx * off, from.y + ny * off);
            ctx.lineTo(to.x + nx * off, to.y + ny * off);
            ctx.strokeStyle = LINE_COLORS.red; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(from.x - nx * off, from.y - ny * off);
            ctx.lineTo(to.x - nx * off, to.y - ny * off);
            ctx.strokeStyle = LINE_COLORS.green; ctx.lineWidth = 2.5; ctx.stroke();
          } else {
            const color = LINE_COLORS[edge.lineType] || "#888";
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = `${color}30`; ctx.lineWidth = 12; ctx.setLineDash([]); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
          }
        }

        // ── Cascade wave (delay mode) ────────────────────────────
        if (scn === "delay") {
          const maxDist = Math.max(...Object.values(CASCADE_DIST));
          const waveFront = cascadeWave * (maxDist + 2);

          for (const edge of EDGES) {
            const from = COORDS[edge.from];
            const to = COORDS[edge.to];
            if (!from || !to) continue;
            const d1 = CASCADE_DIST[edge.from] ?? 99;
            const d2 = CASCADE_DIST[edge.to] ?? 99;
            const edgeDist = Math.min(d1, d2);

            if (edgeDist < waveFront) {
              const intensity = Math.max(0, 1 - (edgeDist / (maxDist + 1)));
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.strokeStyle = `rgba(255, 140, 0, ${intensity * 0.25})`;
              ctx.lineWidth = 16;
              ctx.stroke();
            }
          }

          // Cascade countdown labels
          for (const station of STATIONS) {
            const pos = COORDS[station.id];
            if (!pos) continue;
            const d = CASCADE_DIST[station.id];
            if (d !== undefined && d > 0 && d <= 4) {
              const minutesAway = d * 3;
              const textY = pos.y <= 100 ? pos.y + 32 : pos.y - 32;
              ctx.font = "bold 8px 'Courier New', monospace";
              ctx.fillStyle = `rgba(255, 140, 0, ${0.5 + pulse * 0.3})`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(`~${minutesAway}m`, pos.x, textY);
            }
          }
        }

        // ── OD Flow arcs ──────────────────────────────────────────
        for (const dot of odDotsRef.current) {
          dot.t += dot.speed;
          if (dot.t >= 1) dot.t = 0;

          const flow = OD_FLOWS[dot.flowIdx];
          const from = COORDS[flow.from];
          const to = COORDS[flow.to];
          if (!from || !to) continue;

          const cpx = (from.x + to.x) / 2;
          const cpy = (from.y + to.y) / 2 - 50 * flow.weight;

          // Draw arc (only once per flow, on first dot)
          if (dot.t < dot.speed * 2) {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
            ctx.strokeStyle = "#85B7EB10";
            ctx.lineWidth = Math.max(1, flow.weight * 3);
            ctx.stroke();
          }

          // Dot position on Bezier
          const t = dot.t;
          const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cpx + t * t * to.x;
          const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cpy + t * t * to.y;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#85B7EB";
          ctx.globalAlpha = 0.4 * flow.weight;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // ── Train agents ──────────────────────────────────────────
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
          ctx.beginPath(); ctx.arc(x, y, agent.size + 3, 0, Math.PI * 2);
          ctx.fillStyle = "#85B7EB15"; ctx.fill();
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

          // Outer glow
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 12, 0, Math.PI * 2);
          ctx.fillStyle = glow; ctx.fill();

          // Load arc gauge
          if (load > 0) {
            const arcAngle = (load / 100) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r + 6, -Math.PI / 2, -Math.PI / 2 + arcAngle);
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.setLineDash([]); ctx.stroke();
            ctx.lineCap = "butt";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r + 6, -Math.PI / 2 + arcAngle, -Math.PI / 2 + Math.PI * 2);
            ctx.strokeStyle = "#ffffff0a"; ctx.lineWidth = 3; ctx.stroke();
          }

          if (isJunction) {
            ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 10, 0, Math.PI * 2);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.15 + pulse * 0.1; ctx.stroke(); ctx.globalAlpha = 1;
          }
          if (isPurpleJunction) {
            ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 9, 0, Math.PI * 2);
            ctx.strokeStyle = "#9B8FE8"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1;
          }
          if (isDelayStation) {
            ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 10 + pulse * 4, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 140, 0, ${0.2 + pulse * 0.3})`;
            ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
          }

          // Circle
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.fillStyle = "#0c0c0f"; ctx.fill();
          ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r - 3, 0, Math.PI * 2);
          ctx.strokeStyle = `${color}30`; ctx.lineWidth = 1; ctx.stroke();

          // Abbreviation
          ctx.fillStyle = "#e4e4e7";
          ctx.font = "bold 10px 'Courier New', monospace";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(ABBREVS[station.id] || "", pos.x, pos.y);

          // Name label
          ctx.font = "9px 'Inter', sans-serif";
          ctx.textAlign = "center";
          const nameY = pos.y <= 100 ? pos.y + r + 14 : pos.y - r - 10;
          ctx.textBaseline = pos.y <= 100 ? "top" : "bottom";
          const nameW = ctx.measureText(station.name).width;
          const bgY = pos.y <= 100 ? nameY - 1 : nameY - 11;
          ctx.fillStyle = "#0c0c0f90";
          ctx.fillRect(pos.x - nameW / 2 - 3, bgY, nameW + 6, 13);
          ctx.fillStyle = "#a1a1aa";
          ctx.fillText(station.name, pos.x, nameY);

          // Load badge
          if (load >= 60) {
            const badgeY = pos.y <= 100 ? pos.y + r + 28 : pos.y - r - 24;
            const badgeText = `${load}%`;
            ctx.font = "bold 10px 'Courier New', monospace";
            const tw = ctx.measureText(badgeText).width;
            ctx.fillStyle = load >= 90 ? "#FF444430" : load >= 75 ? "#FF8C0025" : "#FFB80020";
            const bx = pos.x - tw / 2 - 4, by = badgeY - 7, bw = tw + 8, bh = 14, br = 3;
            ctx.beginPath();
            ctx.moveTo(bx + br, by);
            ctx.lineTo(bx + bw - br, by);
            ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
            ctx.lineTo(bx + bw, by + bh - br);
            ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
            ctx.lineTo(bx + br, by + bh);
            ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
            ctx.lineTo(bx, by + br);
            ctx.arcTo(bx, by, bx + br, by, br);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = color;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(badgeText, pos.x, badgeY);
          }

          // ── Crowd density dots ──────────────────────────────────
          if (load >= 40) {
            const crowdCount = Math.floor(load / 8);
            const crowdY = pos.y <= 200 ? pos.y + r + 40 : pos.y - r - 40;
            const crowdWidth = crowdCount * 4;
            const startX = pos.x - crowdWidth / 2;

            for (let ci = 0; ci < crowdCount; ci++) {
              const jitterX = (Math.sin(frameRef.current * 0.05 + ci * 2.3) * 1.5);
              const jitterY = (Math.cos(frameRef.current * 0.04 + ci * 1.7) * 1);
              const cx = startX + ci * 4 + jitterX;
              const cy = crowdY + jitterY;
              const dotSize = load >= 90 ? 2.5 : load >= 75 ? 2 : 1.5;

              ctx.beginPath();
              ctx.arc(cx, cy, dotSize, 0, Math.PI * 2);
              ctx.fillStyle = load >= 90 ? `rgba(255,68,68,${0.5 + pulse * 0.3})` :
                load >= 75 ? "rgba(255,140,0,0.5)" :
                load >= 60 ? "rgba(255,184,0,0.4)" : "rgba(46,204,136,0.3)";
              ctx.fill();
            }
          }
        }

        // ── Legend ─────────────────────────────────────────────────
        const legendItems: Array<{ color: string; label: string }> = [
          { color: LINE_COLORS.red, label: "RED LINE" },
          { color: LINE_COLORS.green, label: "GREEN LINE" },
          { color: LINE_COLORS.purple, label: "PURPLE LINE" },
        ];
        if (scn === "delay") legendItems.push({ color: "#FF8C00", label: "DELAY ZONE" });

        let lx = 14;
        ctx.font = "bold 8px 'Courier New', monospace";
        for (const item of legendItems) {
          ctx.beginPath(); ctx.arc(lx + 4, 14, 4, 0, Math.PI * 2);
          ctx.fillStyle = item.color; ctx.fill();
          ctx.beginPath(); ctx.arc(lx + 4, 14, 6, 0, Math.PI * 2);
          ctx.strokeStyle = `${item.color}40`; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = "#a1a1aa"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText(item.label, lx + 14, 14);
          lx += ctx.measureText(item.label).width + 30;
        }

        // Annotations
        ctx.font = "8px 'Courier New', monospace";
        ctx.fillStyle = "#52525b";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText("JUNCTION: RED ∩ GREEN", 360, 370);
        ctx.fillText("SHARED TRUNK: 28M → HA", 610, 320);

        ctx.textAlign = "right"; ctx.fillStyle = "#52525b";
        ctx.fillText(`SCENARIO: ${scn.toUpperCase()}`, width - 14, 12);
        ctx.fillText(`TICK: ${state?.tick ?? 0}`, width - 14, 24);
      }

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
