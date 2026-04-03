"use client";

import clsx from "clsx";
import type { Scenario, SimState } from "@/lib/types";

interface Props {
  scenario: Scenario;
  simTimeMin: number;
  simState: SimState | null;
  onScenarioChange: (s: Scenario) => void;
  onTimeChange: (minutes: number) => void;
}

const SCENARIOS: Array<{ key: Scenario; label: string; icon: string }> = [
  { key: "normal", label: "Normal", icon: "●" },
  { key: "peak", label: "Rush Hour", icon: "▲" },
  { key: "event", label: "Stadium Event", icon: "◆" },
  { key: "delay", label: "Train Delay", icon: "⚠" },
];

const ACTIVE_STYLES: Record<Scenario, string> = {
  normal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(46,204,136,0.1)]",
  peak: "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(255,184,0,0.1)]",
  event: "bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(255,68,68,0.1)]",
  delay: "bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-[0_0_12px_rgba(255,140,0,0.1)]",
};

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ControlBar({
  scenario,
  simTimeMin,
  onScenarioChange,
  onTimeChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Scenario buttons */}
      <div className="grid grid-cols-2 sm:flex gap-1.5">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            onClick={() => onScenarioChange(s.key)}
            className={clsx(
              "border rounded px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all duration-200",
              scenario === s.key
                ? ACTIVE_STYLES[s.key]
                : "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400",
            )}
          >
            <span className="mr-1.5">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-zinc-800" />

      {/* Time slider */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider whitespace-nowrap">
          Sim Time
        </span>
        <input
          type="range"
          min={300}
          max={1380}
          step={15}
          value={simTimeMin}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          className="flex-1 accent-emerald-500 h-1"
        />
        <span className="text-sm font-mono text-emerald-400 min-w-[3.5rem] text-right tabular-nums">
          {formatTime(simTimeMin)}
        </span>
      </div>
    </div>
  );
}
