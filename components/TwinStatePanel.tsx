"use client";

import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
}

export default function TwinStatePanel({ simState }: Props) {
  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "NODES", value: "21" },
    { label: "EDGES", value: "20 (7 shared)" },
    { label: "LINES", value: "RED · GREEN · PURPLE" },
    { label: "AGENTS", value: simState ? String(Math.round((simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length) * 0.6)) : "—" },
    { label: "TICK", value: simState ? `#${simState.tick.toLocaleString()}` : "—" },
    { label: "SYNC", value: `${simState?.syncedAgo ?? 0}s ago`, highlight: true },
    { label: "TWIN AHEAD", value: `+${simState?.twinAheadMin ?? "—"} min` },
  ];

  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-zinc-600 tracking-wider">{row.label}</span>
          <span className={`text-[10px] font-mono tabular-nums ${row.highlight ? "text-emerald-400" : "text-zinc-400"}`}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
