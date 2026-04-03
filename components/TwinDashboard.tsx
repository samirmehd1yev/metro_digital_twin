"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useTwinStore } from "@/lib/store";
import MetroMap from "./MetroMap";
import ControlBar from "./ControlBar";
import KpiStrip from "./KpiStrip";
import StationList from "./StationList";
import DecisionEngine from "./DecisionEngine";
import TwinStatePanel from "./TwinStatePanel";

const ForecastChart = dynamic(() => import("./ForecastChart"), { ssr: false });

export default function TwinDashboard() {
  const simState = useTwinStore((s) => s.simState);
  const scenario = useTwinStore((s) => s.scenario);
  const simTimeMin = useTwinStore((s) => s.simTimeMin);
  const isLoading = useTwinStore((s) => s.isLoading);
  const forecastPoints = useTwinStore((s) => s.forecastPoints);
  const setScenario = useTwinStore((s) => s.setScenario);
  const setSimTime = useTwinStore((s) => s.setSimTime);
  const startPolling = useTwinStore((s) => s.startPolling);

  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);

  return (
    <div className="min-h-screen bg-zinc-950 p-3 sm:p-4 font-sans text-zinc-100 max-w-7xl mx-auto">
      {/* Loading bar */}
      {!simState && isLoading && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-emerald-400 animate-pulse z-50" />
      )}

      {/* Row 1 — Header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <h1 className="font-medium text-sm text-zinc-100">
          Bak&#305; Metropoliteni &mdash; Digital Twin
        </h1>
        <div className="flex gap-2 ml-auto">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
            sinx {simState?.syncedAgo ?? "—"}s
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-800/50">
            +{simState?.twinAheadMin ?? "—"}m öndə
          </span>
        </div>
      </div>

      {/* Row 2 — ControlBar */}
      <div className="mb-3">
        <ControlBar
          scenario={scenario}
          simTimeMin={simTimeMin}
          simState={simState}
          onScenarioChange={setScenario}
          onTimeChange={setSimTime}
        />
      </div>

      {/* Row 3 — Metro map card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 sm:p-3 mb-3 overflow-x-auto">
        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">
          Metro xəritəsi — Real vaxt
        </div>
        <div className="min-w-[600px]">
          <MetroMap simState={simState} scenario={scenario} />
        </div>
      </div>

      {/* Row 4 — KPI Strip */}
      <div className="mb-3">
        <KpiStrip simState={simState} scenario={scenario} />
      </div>

      {/* Row 5 — Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">
              Stansiya yükləri
            </div>
            <StationList simState={simState} scenario={scenario} />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">
              Twin vəziyyəti
            </div>
            <TwinStatePanel simState={simState} scenario={scenario} />
          </div>
        </div>

        {/* Right column */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">
            Qərar mühərriki
          </div>
          <DecisionEngine scenario={scenario} simState={simState} />
        </div>
      </div>

      {/* Row 6 — Forecast card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">
          Sərnişin axını proqnozu
        </div>
        <ForecastChart points={forecastPoints} scenario={scenario} />
      </div>
    </div>
  );
}
