"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useTwinStore } from "@/lib/store";
import { STATIONS, EDGES } from "@/lib/metro-graph";
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

  const avgLoad = simState
    ? Math.round(simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#080a0f] font-mono text-zinc-300">
      {/* Loading bar */}
      {!simState && isLoading && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-emerald-400 animate-pulse z-50" />
      )}

      {/* ── Top Status Bar ──────────────────────────────────────── */}
      <div className="border-b border-zinc-800/60 bg-[#0a0d14] px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${simState ? "bg-emerald-400 shadow-[0_0_6px_#2ECC88]" : "bg-zinc-600"}`} />
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
            Baku Metro Digital Twin
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-[10px] text-zinc-500">
          SCADA Control View
        </span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-500">SYNC {simState?.syncedAgo ?? "—"}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] text-zinc-500">TWIN +{simState?.twinAheadMin ?? "—"}m AHEAD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${avgLoad >= 80 ? "bg-red-500 animate-pulse" : avgLoad >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} />
            <span className="text-[10px] text-zinc-500">LOAD {avgLoad}%</span>
          </div>
          <span className="text-[10px] text-zinc-600">TICK #{simState?.tick?.toLocaleString() ?? "0"}</span>
        </div>
      </div>

      <div className="p-3 max-w-[1600px] mx-auto">
        {/* ── Control Bar ────────────────────────────────────────── */}
        <div className="mb-3">
          <ControlBar
            scenario={scenario}
            simTimeMin={simTimeMin}
            simState={simState}
            onScenarioChange={setScenario}
            onTimeChange={setSimTime}
          />
        </div>

        {/* ── Metro Map — Main View ──────────────────────────────── */}
        <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Network Topology — Live</span>
            </div>
            <span className="text-[10px] text-zinc-600">{STATIONS.length} NODES · {EDGES.length} EDGES</span>
          </div>
          <div className="min-w-[700px] overflow-x-auto">
            <MetroMap simState={simState} scenario={scenario} />
          </div>
        </div>

        {/* ── KPI Strip ──────────────────────────────────────────── */}
        <div className="mb-3">
          <KpiStrip simState={simState} scenario={scenario} />
        </div>

        {/* ── Three-column grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {/* Station Load Monitor */}
          <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Station Load Monitor</span>
            </div>
            <StationList simState={simState} scenario={scenario} />
          </div>

          {/* Decision Engine */}
          <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Decision Engine</span>
            </div>
            <DecisionEngine scenario={scenario} simState={simState} />
          </div>

          {/* Twin State + Forecast */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Twin State</span>
              </div>
              <TwinStatePanel simState={simState} scenario={scenario} />
            </div>
            <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Passenger Flow Forecast</span>
              </div>
              <ForecastChart points={forecastPoints} scenario={scenario} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Alarm Strip ───────────────────────────────────── */}
      <div className="border-t border-zinc-800/60 bg-[#0a0d14] px-4 py-1.5 flex items-center gap-4">
        <span className="text-[9px] text-zinc-600 uppercase tracking-wider">System Log</span>
        <div className="h-3 w-px bg-zinc-800" />
        {scenario === "delay" ? (
          <span className="text-[10px] text-amber-500 animate-pulse">
            ⚠ ALERT: Train stalled on Koroglu → Qara Qarayev edge — cascade risk detected
          </span>
        ) : scenario === "event" ? (
          <span className="text-[10px] text-red-400">
            ⚠ EVENT: Stadium surge at H.Aslanov — special service activated
          </span>
        ) : scenario === "peak" ? (
          <span className="text-[10px] text-amber-400">
            ● PEAK HOURS: Reduced intervals active — monitoring platform density
          </span>
        ) : (
          <span className="text-[10px] text-emerald-500/70">
            ● ALL SYSTEMS NOMINAL — next peak window at 17:00
          </span>
        )}
        <span className="ml-auto text-[9px] text-zinc-700">
          {new Date().toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
    </div>
  );
}
