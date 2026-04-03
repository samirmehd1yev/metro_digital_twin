"use client";

import clsx from "clsx";
import type { Scenario, SimState } from "@/lib/types";

interface Props {
  scenario: Scenario;
  simState: SimState | null;
}

interface Recommendation {
  level: "info" | "warning" | "critical";
  tag: string;
  text: string;
  action: string;
}

const RECOMMENDATIONS: Record<Scenario, Recommendation[]> = {
  normal: [
    { level: "info", tag: "STATUS", text: "All stations operating within normal parameters. 28 May junction balanced.", action: "No intervention required" },
    { level: "info", tag: "FORECAST", text: "Peak window begins at 17:30. Koroglu entering risk zone.", action: "Pre-stage Koroglu capacity by 17:00" },
  ],
  peak: [
    { level: "warning", tag: "WARNING", text: "28 May approaching capacity threshold. Sahil platform congested.", action: "Reduce headway to 2 min interval" },
    { level: "warning", tag: "REDIRECT", text: "Cars 1–3 at capacity, cars 4–6 underutilized.", action: "PA: Direct passengers to rear cars" },
    { level: "info", tag: "OPTIMIZE", text: "Bakmil shuttle can absorb overflow from main trunk.", action: "Increase Bakmil-Narimanov frequency" },
  ],
  event: [
    { level: "critical", tag: "CRITICAL", text: "Stadium event: H.Aslanov projected at 190% in 35 minutes.", action: "Deploy emergency shuttle service" },
    { level: "critical", tag: "CASCADE", text: "Ahmadli–H.Aslanov: wave propagation on shared trunk.", action: "Switch to 1.5 min headway immediately" },
    { level: "warning", tag: "MITIGATE", text: "Redirect 20% passenger flow to surface transport.", action: "Notify bus dispatch for stadium routes" },
  ],
  delay: [
    { level: "critical", tag: "DELAY", text: "Koroglu–Q.Qarayev: train stalled on shared trunk.", action: "Provide alternative routing via H.Aslanov" },
    { level: "warning", tag: "BUILDUP", text: "Systematic passenger accumulation at Koroglu station.", action: "Extend door time, initiate platform clearing" },
  ],
};

const LEVEL_STYLES = {
  info: { border: "border-l-emerald-500", icon: "text-emerald-500", action: "text-emerald-400", bg: "bg-emerald-500/5" },
  warning: { border: "border-l-amber-500", icon: "text-amber-500", action: "text-amber-400", bg: "bg-amber-500/5" },
  critical: { border: "border-l-red-500", icon: "text-red-500", action: "text-red-400", bg: "bg-red-500/5" },
};

const LEVEL_ICONS = { info: "●", warning: "▲", critical: "◆" };

export default function DecisionEngine({ scenario }: Props) {
  const recs = RECOMMENDATIONS[scenario];

  return (
    <div className="space-y-2">
      {recs.map((rec, i) => {
        const style = LEVEL_STYLES[rec.level];
        return (
          <div
            key={i}
            className={clsx("border-l-2 rounded-r p-2.5", style.border, style.bg)}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className={clsx("text-[10px]", style.icon)}>{LEVEL_ICONS[rec.level]}</span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                {rec.tag}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-relaxed mb-1.5">
              {rec.text}
            </div>
            <div className={clsx("text-[10px] font-mono font-medium", style.action)}>
              → {rec.action}
            </div>
          </div>
        );
      })}
    </div>
  );
}
