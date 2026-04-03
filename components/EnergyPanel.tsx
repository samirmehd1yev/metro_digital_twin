"use client";

import type { EnergyMetrics } from "@/lib/types";

interface Props {
  energy: EnergyMetrics | null;
}

function effColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-amber-400";
  return "text-red-400";
}

export default function EnergyPanel({ energy }: Props) {
  if (!energy) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-zinc-800/30 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "CONSUMPTION",
      value: `${energy.consumptionKwh}`,
      unit: "kWh",
      color: "text-blue-400",
    },
    {
      label: "CO₂ EMISSION",
      value: `${energy.co2Tons}`,
      unit: "t",
      color: "text-zinc-400",
    },
    {
      label: "REGEN BRAKING",
      value: `${energy.regenPercent}`,
      unit: "%",
      color: "text-emerald-400",
    },
    {
      label: "EFFICIENCY",
      value: `${energy.efficiencyScore}`,
      unit: "%",
      color: effColor(energy.efficiencyScore),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <div key={card.label} className="bg-[#0c0f16] rounded p-2 border border-zinc-800/30">
          <div className="text-[8px] font-mono text-zinc-600 tracking-wider mb-1">{card.label}</div>
          <div className={`text-sm font-mono font-bold tabular-nums ${card.color}`}>
            {card.value}
            <span className="text-[9px] text-zinc-600 ml-0.5">{card.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
