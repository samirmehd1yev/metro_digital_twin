"use client";

import clsx from "clsx";
import type { Scenario, SimState } from "@/lib/types";

interface Props {
  scenario: Scenario;
  simState: SimState | null;
}

interface Recommendation {
  level: "info" | "warning" | "danger";
  tag: string;
  az: string;
  action: string;
}

const RECOMMENDATIONS: Record<Scenario, Recommendation[]> = {
  normal: [
    {
      level: "info",
      tag: "STATUS",
      az: "Bütün stansiyalar normalda. 28 May balansda.",
      action: "Heç bir müdaxilə tələb olunmur",
    },
    {
      level: "info",
      tag: "PROQNOZ",
      az: "Pik 17:30-da başlayır. Koroğlu risk zonasında.",
      action: "17:00 öncə Koroğlu hazırlığı",
    },
  ],
  peak: [
    {
      level: "warning",
      tag: "XƏBƏRDARLIQ",
      az: "28 May → həddə yaxındır. Sahil platformu dolub.",
      action: "Intervalı 2 dəqiqəyə endir",
    },
    {
      level: "warning",
      tag: "YÖNLƏNDİR",
      az: "Vaqon 1–3 həddaşmış, vaqon 4–6 boşdur.",
      action: 'PA: "Arxa vaqonlara keçin"',
    },
    {
      level: "info",
      tag: "BAKMIL",
      az: "Bakmil xidməti artıq trafiki azalda bilər.",
      action: "Bakmil-Nərimanov intervalı artır",
    },
  ],
  event: [
    {
      level: "danger",
      tag: "KRİTİK",
      az: "Tofiq Bəhramov: H.Aslanov 35 dəqiqə içinde 190%.",
      action: "Xüsusi qatar xidməti başlat",
    },
    {
      level: "danger",
      tag: "KASKAD",
      az: "Əhmədli–H.Aslanov: shared xətt üzərindən dalğa.",
      action: "Dərhal 1.5 dəq intervalına keç",
    },
    {
      level: "warning",
      tag: "MİTİQASİYA",
      az: "20% axını səthi nəqliyyata yönləndir.",
      action: "Avtobus dispetçerinə məlumat ver",
    },
  ],
  delay: [
    {
      level: "danger",
      tag: "GECİKMƏ",
      az: "Koroğlu–Q.Qarayev: shared xəttdə qatar dayanıb.",
      action: "H.Aslanov istiqamətinə alternativ ver",
    },
    {
      level: "warning",
      tag: "TOPLANMA",
      az: "Koroğlu stansiyasında sistematik yığılma.",
      action: "Qapı müddəti uzadılsın, peron boşaldılsın",
    },
  ],
};

const BORDER_COLORS: Record<string, string> = {
  info: "border-l-emerald-500",
  warning: "border-l-amber-500",
  danger: "border-l-red-500",
};

const ACTION_COLORS: Record<string, string> = {
  info: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
};

export default function DecisionEngine({ scenario }: Props) {
  const recs = RECOMMENDATIONS[scenario];

  return (
    <div>
      {recs.map((rec, i) => (
        <div
          key={i}
          className={clsx(
            "border-l-2 rounded-r-md p-2.5 mb-2 bg-zinc-800/50",
            BORDER_COLORS[rec.level],
          )}
        >
          <div className="text-[9px] font-mono text-zinc-500 uppercase mb-0.5">
            {rec.tag}
          </div>
          <div className="text-xs text-zinc-300 leading-snug">
            {rec.az}
          </div>
          <div className={clsx("text-[11px] font-medium mt-1", ACTION_COLORS[rec.level])}>
            &rarr; {rec.action}
          </div>
        </div>
      ))}
    </div>
  );
}
