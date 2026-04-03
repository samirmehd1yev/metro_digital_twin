"use client";

import clsx from "clsx";
import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
}

const SCENARIO_INTERVALS: Record<Scenario, number> = {
  normal: 4,
  peak: 2,
  event: 3,
  delay: 6,
};

function loadValueColor(avg: number): string {
  if (avg >= 90) return "text-red-400";
  if (avg >= 75) return "text-orange-400";
  if (avg >= 60) return "text-amber-400";
  return "text-emerald-400";
}

export default function KpiStrip({ simState, scenario }: Props) {
  const avgLoad = simState
    ? Math.round(simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length)
    : null;

  const agentCount = simState
    ? Math.round(
        (simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length) * 0.6,
      )
    : null;

  const interval = SCENARIO_INTERVALS[scenario];

  const cards: Array<{ label: string; value: string; colorClass?: string }> = [
    {
      label: "Sistem yükü",
      value: avgLoad !== null ? `${avgLoad}%` : "—",
      colorClass: avgLoad !== null ? loadValueColor(avgLoad) : "text-zinc-500",
    },
    {
      label: "Aktiv agent",
      value: agentCount !== null ? String(agentCount) : "—",
      colorClass: "text-zinc-100",
    },
    {
      label: "Qatar intervalı",
      value: `${interval} dəq`,
      colorClass: "text-zinc-100",
    },
    {
      label: "Mesa tick",
      value: simState ? simState.tick.toLocaleString() : "—",
      colorClass: "text-zinc-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-3"
        >
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide mb-1">
            {card.label}
          </div>
          <div className={clsx("text-xl font-medium", card.colorClass)}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
