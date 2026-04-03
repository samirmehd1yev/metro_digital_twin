"use client";

import { STATIONS } from "@/lib/metro-graph";
import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
}

function barColor(load: number): string {
  if (load >= 90) return "bg-red-500";
  if (load >= 75) return "bg-orange-500";
  if (load >= 60) return "bg-amber-500";
  return "bg-emerald-500";
}

function dotStyle(line: string): React.CSSProperties {
  if (line === "red") return { backgroundColor: "#C04040" };
  if (line === "green") return { backgroundColor: "#1D9E75" };
  if (line === "purple") return { backgroundColor: "#7F77DD" };
  return {
    background: "linear-gradient(90deg, #C04040 50%, #1D9E75 50%)",
  };
}

export default function StationList({ simState, scenario }: Props) {
  if (!simState) {
    return (
      <div className="max-h-64 overflow-y-auto space-y-1">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" />
            <div className="flex-1 h-3 bg-zinc-800 animate-pulse rounded" />
            <div className="w-16 h-1.5 bg-zinc-800 animate-pulse rounded-full" />
            <div className="w-7 h-3 bg-zinc-800 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  const stationsWithLoad = STATIONS.map((s) => {
    const st = simState.stations.find((ss) => ss.id === s.id);
    return { ...s, load: st?.load ?? 0 };
  });

  if (scenario === "peak" || scenario === "event") {
    stationsWithLoad.sort((a, b) => b.load - a.load);
  } else {
    stationsWithLoad.sort((a, b) => a.nameAz.localeCompare(b.nameAz, "az"));
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      {stationsWithLoad.map((s) => (
        <div key={s.id} className="flex items-center gap-2 py-1">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={dotStyle(s.line)}
          />
          <span className="text-xs text-zinc-300 flex-1 truncate">
            {s.nameAz}
          </span>
          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
            <div
              className={`h-full rounded-full ${barColor(s.load)}`}
              style={{ width: `${s.load}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 w-7 text-right flex-shrink-0">
            {s.load}%
          </span>
        </div>
      ))}
    </div>
  );
}
