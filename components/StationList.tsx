"use client";

import { STATIONS } from "@/lib/metro-graph";
import type { SimState, Scenario } from "@/lib/types";

interface Props {
  simState: SimState | null;
  scenario: Scenario;
}

function barColor(load: number): string {
  if (load >= 90) return "bg-red-500 shadow-[0_0_6px_rgba(255,68,68,0.3)]";
  if (load >= 75) return "bg-orange-500";
  if (load >= 60) return "bg-amber-500";
  return "bg-emerald-500";
}

function dotColor(line: string): string {
  if (line === "red") return "bg-red-400";
  if (line === "green") return "bg-emerald-400";
  if (line === "purple") return "bg-purple-400";
  return "bg-gradient-to-r from-red-400 to-emerald-400";
}

function dotStyle(line: string): React.CSSProperties | undefined {
  if (line === "shared") return { background: "linear-gradient(90deg, #E05555 50%, #2ECC88 50%)" };
  return undefined;
}

export default function StationList({ simState, scenario }: Props) {
  if (!simState) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse" />
            <div className="flex-1 h-2.5 bg-zinc-800/50 animate-pulse rounded" />
            <div className="w-14 h-1.5 bg-zinc-800/50 animate-pulse rounded-full" />
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
    stationsWithLoad.sort((a, b) => a.name.localeCompare(b.name, "en"));
  }

  return (
    <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin">
      {stationsWithLoad.map((s) => (
        <div key={s.id} className="flex items-center gap-2 py-[3px] group">
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor(s.line)}`}
            style={dotStyle(s.line)}
          />
          <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 flex-1 truncate transition-colors font-mono">
            {s.name}
          </span>
          <div className="w-20 h-1 bg-zinc-800/50 rounded-full overflow-hidden flex-shrink-0">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor(s.load)}`}
              style={{ width: `${s.load}%` }}
            />
          </div>
          <span className={`text-[10px] font-mono w-8 text-right flex-shrink-0 tabular-nums ${
            s.load >= 90 ? "text-red-400" : s.load >= 75 ? "text-orange-400" : s.load >= 60 ? "text-amber-400" : "text-zinc-600"
          }`}>
            {s.load}%
          </span>
        </div>
      ))}
    </div>
  );
}
