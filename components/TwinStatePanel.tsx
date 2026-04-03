"use client";

import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
}

export default function TwinStatePanel({ simState }: Props) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Qovşaqlar", value: "21" },
    { label: "Kənarlar", value: "20 (7 shared)" },
    { label: "Xətlər", value: "Qırmızı · Yaşıl · Bənövşəyi" },
    {
      label: "Agentlər",
      value: simState
        ? String(
            Math.round(
              (simState.stations.reduce((s, st) => s + st.load, 0) /
                simState.stations.length) *
                0.6,
            ),
          )
        : "—",
    },
    { label: "Mesa tick", value: simState ? `#${simState.tick.toLocaleString()}` : "—" },
    { label: "Sinx", value: `${simState?.syncedAgo ?? 0}s əvvəl` },
    { label: "Twin öndə", value: `+${simState?.twinAheadMin ?? "—"} dəq` },
  ];

  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between">
          <span className="text-zinc-500 text-[11px] font-mono">{row.label}</span>
          <span className="text-zinc-200 text-[11px] font-mono">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
