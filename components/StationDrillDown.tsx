"use client";

import { useEffect, useRef } from "react";
import { STATIONS } from "@/lib/metro-graph";
import type { SimState, Scenario } from "@/lib/types";

interface Props {
  stationId: string;
  simState: SimState | null;
  scenario: Scenario;
  history: number[];
  onClose: () => void;
}

function loadColor(load: number): string {
  if (load >= 90) return "#FF4444";
  if (load >= 75) return "#FF8C00";
  if (load >= 60) return "#FFB800";
  return "#2ECC88";
}

function lineLabel(line: string): string {
  if (line === "red") return "Red Line";
  if (line === "green") return "Green Line";
  if (line === "purple") return "Purple Line";
  return "Shared Trunk";
}

function lineColor(line: string): string {
  if (line === "red") return "text-red-400";
  if (line === "green") return "text-emerald-400";
  if (line === "purple") return "text-purple-400";
  return "text-blue-400";
}

export default function StationDrillDown({ stationId, simState, scenario, history, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const station = STATIONS.find((s) => s.id === stationId);
  const stState = simState?.stations.find((s) => s.id === stationId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= h; y += h / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Threshold lines
    const y75 = h - (75 / 100) * h;
    const y90 = h - (90 / 100) * h;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#FFB80030";
    ctx.beginPath(); ctx.moveTo(0, y75); ctx.lineTo(w, y75); ctx.stroke();
    ctx.strokeStyle = "#FF444430";
    ctx.beginPath(); ctx.moveTo(0, y90); ctx.lineTo(w, y90); ctx.stroke();
    ctx.setLineDash([]);

    // Data line
    const step = w / (history.length - 1);
    const currentLoad = history[history.length - 1];
    const color = loadColor(currentLoad);

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `${color}20`);
    grad.addColorStop(1, `${color}02`);

    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < history.length; i++) {
      const x = i * step;
      const y = h - (history[i] / 100) * h;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo((history.length - 1) * step, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = i * step;
      const y = h - (history[i] / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current dot
    const lastX = (history.length - 1) * step;
    const lastY = h - (currentLoad / 100) * h;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [history]);

  if (!station) return null;

  const load = stState?.load ?? 0;
  const flow = stState?.flow ?? 0;
  const utilization = Math.round((load / 100) * 100);
  const color = loadColor(load);

  // Scenario-specific recommendation
  let recommendation = "Operating within normal parameters";
  if (scenario === "delay" && (stationId === "koroglu" || stationId === "qara-qarayev")) {
    recommendation = "⚠ Affected by active train delay — reroute passengers via alternative paths";
  } else if (scenario === "event" && (stationId === "ahmadli" || stationId === "hazi-aslanov")) {
    recommendation = "⚠ Stadium event surge — deploy overflow shuttles and extend platform staff";
  } else if (load >= 90) {
    recommendation = "⚠ Critical load — reduce headway and activate crowd management protocols";
  } else if (load >= 75) {
    recommendation = "Approaching threshold — monitor closely and prepare contingency";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-[#0a0d14] border-l border-zinc-800/50 p-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-mono font-bold text-zinc-200">{station.name}</h2>
            <span className={`text-[10px] font-mono ${lineColor(station.line)}`}>
              {lineLabel(station.line)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Load gauge */}
        <div className="bg-[#0c0f16] rounded-lg p-3 border border-zinc-800/30 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono text-zinc-600 tracking-wider">CURRENT LOAD</span>
            <span className="text-lg font-mono font-bold tabular-nums" style={{ color }}>{load}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${load}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#0c0f16] rounded p-2 border border-zinc-800/30">
            <div className="text-[8px] font-mono text-zinc-600 tracking-wider">FLOW</div>
            <div className="text-sm font-mono font-bold text-blue-400 tabular-nums">{flow.toLocaleString()}<span className="text-[9px] text-zinc-600"> pax/h</span></div>
          </div>
          <div className="bg-[#0c0f16] rounded p-2 border border-zinc-800/30">
            <div className="text-[8px] font-mono text-zinc-600 tracking-wider">CAPACITY</div>
            <div className="text-sm font-mono font-bold text-zinc-400 tabular-nums">{station.capacityPerHour.toLocaleString()}<span className="text-[9px] text-zinc-600"> pax/h</span></div>
          </div>
          <div className="bg-[#0c0f16] rounded p-2 border border-zinc-800/30">
            <div className="text-[8px] font-mono text-zinc-600 tracking-wider">UTILIZATION</div>
            <div className="text-sm font-mono font-bold tabular-nums" style={{ color }}>{utilization}%</div>
          </div>
          <div className="bg-[#0c0f16] rounded p-2 border border-zinc-800/30">
            <div className="text-[8px] font-mono text-zinc-600 tracking-wider">BASE DEMAND</div>
            <div className="text-sm font-mono font-bold text-purple-400 tabular-nums">{Math.round(station.baseDemand * 100)}%</div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="bg-[#0c0f16] rounded-lg p-3 border border-zinc-800/30 mb-3">
          <div className="text-[9px] font-mono text-zinc-600 tracking-wider mb-2">LOAD HISTORY (LAST 60 TICKS)</div>
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: 80 }}
          />
        </div>

        {/* Recommendation */}
        <div className="bg-[#0c0f16] rounded-lg p-3 border border-zinc-800/30">
          <div className="text-[9px] font-mono text-zinc-600 tracking-wider mb-1">RECOMMENDATION</div>
          <div className="text-[11px] font-mono text-zinc-400 leading-relaxed">{recommendation}</div>
        </div>
      </div>
    </div>
  );
}
