"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { AlarmEntry } from "@/lib/types";

interface Props {
  alarms: AlarmEntry[];
}

const LEVEL_STYLES = {
  info: { dot: "bg-emerald-500", text: "text-emerald-400/70", border: "border-emerald-500/20" },
  warning: { dot: "bg-amber-500 animate-pulse", text: "text-amber-400", border: "border-amber-500/20" },
  critical: { dot: "bg-red-500 animate-pulse", text: "text-red-400", border: "border-red-500/30" },
};

const LEVEL_ICONS = { info: "●", warning: "▲", critical: "◆" };

export default function AlarmFeed({ alarms }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [alarms.length]);

  if (!alarms.length) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
        <span className="text-[10px] font-mono text-emerald-500/50">ALL SYSTEMS NOMINAL — no active alarms</span>
      </div>
    );
  }

  const reversed = [...alarms].reverse();

  return (
    <div ref={scrollRef} className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
      {reversed.map((alarm) => {
        const style = LEVEL_STYLES[alarm.level];
        return (
          <div
            key={alarm.id}
            className={clsx(
              "flex items-start gap-2 py-1 px-2 rounded border-l-2 transition-colors",
              style.border,
              alarm.level === "critical" ? "bg-red-500/5" : "bg-transparent"
            )}
          >
            <span className={clsx("text-[9px] mt-0.5", style.text)}>{LEVEL_ICONS[alarm.level]}</span>
            <div className="flex-1 min-w-0">
              <span className={clsx("text-[10px] font-mono", style.text)}>{alarm.message}</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-700 whitespace-nowrap">
              T{alarm.tick}
            </span>
          </div>
        );
      })}
    </div>
  );
}
