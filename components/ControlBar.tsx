"use client";

import clsx from "clsx";
import type { Scenario, SimState, ViewMode } from "@/lib/types";

interface Props {
  scenario: Scenario;
  simTimeMin: number;
  simState: SimState | null;
  onScenarioChange: (s: Scenario) => void;
  onTimeChange: (minutes: number) => void;
  // Playback
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayToggle: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Compare
  compareMode: boolean;
  compareScenario: Scenario;
  onCompareModeChange: (on: boolean) => void;
  onCompareScenarioChange: (s: Scenario) => void;
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

const SPEEDS = [1, 2, 5, 10];

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ControlBar({
  scenario, simTimeMin, onScenarioChange, onTimeChange,
  isPlaying, playbackSpeed, onPlayToggle, onSpeedChange,
  viewMode, onViewModeChange,
  compareMode, compareScenario, onCompareModeChange, onCompareScenarioChange,
}: Props) {
  return (
    <div className="space-y-2">
      {/* Row 1: Scenarios + playback */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Scenario buttons */}
        <div className="grid grid-cols-2 sm:flex gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => onScenarioChange(s.key)}
              className={clsx(
                "border rounded px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all duration-200",
                scenario === s.key
                  ? ACTIVE_STYLES[s.key]
                  : "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400",
              )}
            >
              <span className="mr-1">{s.icon}</span>{s.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-6 w-px bg-zinc-800" />

        {/* Playback controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPlayToggle(!isPlaying)}
            className={clsx(
              "w-7 h-7 flex items-center justify-center rounded border text-xs font-mono transition-all",
              isPlaying
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                : "text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
            )}
            title={isPlaying ? "Pause" : "Play time-lapse"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
          {SPEEDS.map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={clsx(
                "px-1.5 py-0.5 rounded border text-[9px] font-mono transition-all",
                playbackSpeed === spd
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/40"
                  : "text-zinc-600 border-zinc-800 hover:text-zinc-400"
              )}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-6 w-px bg-zinc-800" />

        {/* Time slider */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[9px] text-zinc-600 uppercase tracking-wider whitespace-nowrap">Time</span>
          <input
            type="range" min={300} max={1380} step={15}
            value={simTimeMin}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="flex-1 accent-emerald-500 h-1 min-w-0"
          />
          <span className="text-xs font-mono text-emerald-400 min-w-[3rem] text-right tabular-nums">
            {formatTime(simTimeMin)}
          </span>
        </div>
      </div>

      {/* Row 2: View mode + Compare */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-zinc-800 rounded overflow-hidden">
          <button
            onClick={() => onViewModeChange("topology")}
            className={clsx(
              "px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider transition-all",
              viewMode === "topology"
                ? "bg-zinc-800 text-zinc-300"
                : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            Topology
          </button>
          <button
            onClick={() => onViewModeChange("heatmap")}
            className={clsx(
              "px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider transition-all",
              viewMode === "heatmap"
                ? "bg-zinc-800 text-zinc-300"
                : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            Heatmap
          </button>
        </div>

        <div className="h-5 w-px bg-zinc-800" />

        {/* Compare toggle */}
        <button
          onClick={() => onCompareModeChange(!compareMode)}
          className={clsx(
            "px-2.5 py-1 rounded border text-[9px] font-mono uppercase tracking-wider transition-all",
            compareMode
              ? "bg-purple-500/10 text-purple-400 border-purple-500/40"
              : "text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-700"
          )}
        >
          Compare
        </button>

        {/* Compare scenario selector */}
        {compareMode && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-600 font-mono">vs</span>
            {SCENARIOS.filter((s) => s.key !== scenario).map((s) => (
              <button
                key={s.key}
                onClick={() => onCompareScenarioChange(s.key)}
                className={clsx(
                  "px-2 py-0.5 rounded border text-[9px] font-mono transition-all",
                  compareScenario === s.key
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/40"
                    : "text-zinc-600 border-zinc-800 hover:text-zinc-400"
                )}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
