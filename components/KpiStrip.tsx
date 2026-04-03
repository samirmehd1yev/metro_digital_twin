"use client";

import clsx from "clsx";
import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
}

const SCENARIO_INTERVALS: Record<Scenario, number> = { normal: 4, peak: 2, event: 3, delay: 6 };
const SCENARIO_AGENTS: Record<Scenario, number> = { normal: 22, peak: 60, event: 45, delay: 18 };

export default function KpiStrip({ simState, scenario }: Props) {
  const avgLoad = simState
    ? Math.round(simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length)
    : null;

  const loadColor = avgLoad === null ? "text-zinc-600"
    : avgLoad >= 90 ? "text-red-400" : avgLoad >= 75 ? "text-orange-400"
    : avgLoad >= 60 ? "text-amber-400" : "text-emerald-400";

  const loadGlow = avgLoad === null ? ""
    : avgLoad >= 90 ? "shadow-[0_0_20px_rgba(255,68,68,0.15)]"
    : avgLoad >= 75 ? "shadow-[0_0_20px_rgba(255,140,0,0.1)]" : "";

  const cards: Array<{ label: string; value: string; unit?: string; color: string; glow?: string }> = [
    { label: "System Load", value: avgLoad !== null ? `${avgLoad}` : "—", unit: "%", color: loadColor, glow: loadGlow },
    { label: "Active Agents", value: `${SCENARIO_AGENTS[scenario]}`, color: "text-blue-400" },
    { label: "Train Interval", value: `${SCENARIO_INTERVALS[scenario]}`, unit: "min", color: "text-purple-400" },
    { label: "Stations Online", value: simState ? `${simState.stations.length}` : "—", unit: "/21", color: "text-emerald-400" },
    { label: "Sim Tick", value: simState ? `${simState.tick}` : "—", color: "text-zinc-400" },
    { label: "Scenario", value: scenario.toUpperCase(), color: scenario === "delay" ? "text-orange-400" : scenario === "event" ? "text-red-400" : scenario === "peak" ? "text-amber-400" : "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className={clsx(
            "bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-2.5",
            card.glow,
          )}
        >
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">
            {card.label}
          </div>
          <div className={clsx("text-lg font-mono font-bold tabular-nums", card.color)}>
            {card.value}
            {card.unit && <span className="text-xs text-zinc-600 ml-0.5">{card.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
