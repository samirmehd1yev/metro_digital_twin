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

const SCENARIOS: Array<{ key: Scenario; label: string }> = [
  { key: "normal", label: "Adi gün" },
  { key: "peak", label: "Pik saat" },
  { key: "event", label: "Böyük tədbir" },
  { key: "delay", label: "Qatar gecikməsi" },
];

const ACTIVE_STYLES: Record<Scenario, string> = {
  normal: "bg-emerald-900/40 text-emerald-400 border-emerald-700",
  peak: "bg-amber-900/40 text-amber-400 border-amber-700",
  event: "bg-red-900/40 text-red-400 border-red-700",
  delay: "bg-zinc-800 text-zinc-200 border-zinc-600",
};

const PEAK_MINUTES = [450, 510, 540, 1020, 1080, 1140];

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ControlBar({
  scenario,
  simTimeMin,
  simState,
  onScenarioChange,
  onTimeChange,
}: Props) {
  return (
    <div className="space-y-2">
      {/* Scenario buttons */}
      <div className="flex gap-1.5 w-full">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            onClick={() => onScenarioChange(s.key)}
            className={clsx(
              "border rounded-lg text-sm py-1.5 px-1 flex-1 transition-colors",
              scenario === s.key
                ? ACTIVE_STYLES[s.key]
                : "bg-transparent text-zinc-500 border-zinc-700 hover:bg-zinc-800",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Time slider row */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-zinc-500 text-xs whitespace-nowrap">
          Sim vaxtı:
        </span>
        <div className="relative flex-1">
          {/* Peak hour indicators */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            {PEAK_MINUTES.map((pm) => {
              const pct = ((pm - 300) / (1380 - 300)) * 100;
              return (
                <div
                  key={pm}
                  className="absolute w-1 h-1 rounded-full bg-amber-500"
                  style={{ left: `${pct}%` }}
                />
              );
            })}
          </div>
          <input
            type="range"
            min={300}
            max={1380}
            step={15}
            value={simTimeMin}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        <span className="font-mono font-medium text-sm min-w-[3rem] text-right text-zinc-300">
          {formatTime(simTimeMin)}
        </span>
      </div>

      {/* Status badges */}
      <div className="flex gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
          sinx {simState?.syncedAgo ?? "—"}s əvvəl
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-800/50">
          +{simState?.twinAheadMin ?? "—"}m öndə
        </span>
      </div>
    </div>
  );
}
