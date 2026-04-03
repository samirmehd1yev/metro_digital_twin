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
import AlarmFeed from "./AlarmFeed";
import ResilienceGauge from "./ResilienceGauge";
import EnergyPanel from "./EnergyPanel";
import StationDrillDown from "./StationDrillDown";

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

  // Advanced features
  const viewMode = useTwinStore((s) => s.viewMode);
  const isPlaying = useTwinStore((s) => s.isPlaying);
  const playbackSpeed = useTwinStore((s) => s.playbackSpeed);
  const selectedStation = useTwinStore((s) => s.selectedStation);
  const compareMode = useTwinStore((s) => s.compareMode);
  const compareScenario = useTwinStore((s) => s.compareScenario);
  const compareState = useTwinStore((s) => s.compareState);
  const stationHistory = useTwinStore((s) => s.stationHistory);
  const setViewMode = useTwinStore((s) => s.setViewMode);
  const setPlaying = useTwinStore((s) => s.setPlaying);
  const setPlaybackSpeed = useTwinStore((s) => s.setPlaybackSpeed);
  const setSelectedStation = useTwinStore((s) => s.setSelectedStation);
  const setCompareMode = useTwinStore((s) => s.setCompareMode);
  const setCompareScenario = useTwinStore((s) => s.setCompareScenario);

  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);

  const avgLoad = simState
    ? Math.round(simState.stations.reduce((s, st) => s + st.load, 0) / simState.stations.length)
    : 0;

  const compareAvgLoad = compareState
    ? Math.round(compareState.stations.reduce((s, st) => s + st.load, 0) / compareState.stations.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#080a0f] font-mono text-zinc-300">
      {/* Loading bar */}
      {!simState && isLoading && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-emerald-400 animate-pulse z-50" />
      )}

      {/* ── Top Status Bar ──────────────────────────────────────── */}
      <div className="border-b border-zinc-800/60 bg-[#0a0d14] px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${simState ? "bg-emerald-400 shadow-[0_0_6px_#2ECC88]" : "bg-zinc-600"}`} />
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
            Baku Metro Digital Twin
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-800 flex-shrink-0 hidden sm:block" />
        <span className="text-[10px] text-zinc-500 hidden sm:block">SCADA Control</span>
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-500">SYNC {simState?.syncedAgo ?? "—"}s</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] text-zinc-500">+{simState?.twinAheadMin ?? "—"}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${avgLoad >= 80 ? "bg-red-500 animate-pulse" : avgLoad >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} />
            <span className="text-[10px] text-zinc-500">{avgLoad}%</span>
          </div>
          {isPlaying && (
            <span className="text-[10px] text-emerald-400 animate-pulse">▶ {playbackSpeed}x</span>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-3 max-w-[1600px] mx-auto">
        {/* ── Control Bar ────────────────────────────────────────── */}
        <div className="mb-3">
          <ControlBar
            scenario={scenario}
            simTimeMin={simTimeMin}
            simState={simState}
            onScenarioChange={setScenario}
            onTimeChange={setSimTime}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onPlayToggle={setPlaying}
            onSpeedChange={setPlaybackSpeed}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            compareMode={compareMode}
            compareScenario={compareScenario}
            onCompareModeChange={setCompareMode}
            onCompareScenarioChange={setCompareScenario}
          />
        </div>

        {/* ── Metro Map — Main View ──────────────────────────────── */}
        {compareMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            {/* Current scenario */}
            <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{scenario.toUpperCase()} — Current</span>
                </div>
                <span className="text-[10px] text-zinc-600">AVG {avgLoad}%</span>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <MetroMap simState={simState} scenario={scenario} viewMode={viewMode} onStationClick={setSelectedStation} />
                </div>
              </div>
            </div>
            {/* Compare scenario */}
            <div className="bg-[#0a0d14] border border-purple-800/30 rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] text-purple-400 uppercase tracking-wider">{compareScenario.toUpperCase()} — Compare</span>
                </div>
                <span className="text-[10px] text-zinc-600">AVG {compareAvgLoad}%</span>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <MetroMap simState={compareState} scenario={compareScenario} viewMode={viewMode} onStationClick={setSelectedStation} />
                </div>
              </div>
            </div>
            {/* Delta KPIs */}
            {simState && compareState && (
              <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {simState.stations.slice(0, 6).map((st) => {
                  const cst = compareState.stations.find((c) => c.id === st.id);
                  const delta = (cst?.load ?? 0) - st.load;
                  return (
                    <div key={st.id} className="bg-[#0a0d14] border border-zinc-800/30 rounded p-2">
                      <div className="text-[8px] text-zinc-600 font-mono truncate">{STATIONS.find((s) => s.id === st.id)?.name ?? st.id}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-mono font-bold text-zinc-400">{st.load}%</span>
                        <span className={`text-[10px] font-mono font-bold ${delta > 0 ? "text-red-400" : delta < 0 ? "text-emerald-400" : "text-zinc-600"}`}>
                          {delta > 0 ? `+${delta}` : delta}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-2 sm:p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Network {viewMode === "heatmap" ? "Heatmap" : "Topology"} — Live
                </span>
              </div>
              <span className="text-[10px] text-zinc-600">{STATIONS.length} NODES · {EDGES.length} EDGES</span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <MetroMap simState={simState} scenario={scenario} viewMode={viewMode} onStationClick={setSelectedStation} />
              </div>
            </div>
          </div>
        )}

        {/* ── KPI Strip ──────────────────────────────────────────── */}
        <div className="mb-3">
          <KpiStrip simState={simState} scenario={scenario} />
        </div>

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-3">
          {/* Station Load Monitor — spans 1 col */}
          <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Station Monitor</span>
            </div>
            <StationList simState={simState} scenario={scenario} />
          </div>

          {/* Decision Engine — spans 1 col */}
          <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Decision Engine</span>
            </div>
            <DecisionEngine scenario={scenario} simState={simState} />
          </div>

          {/* Resilience + Energy — spans 1 col */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Network Resilience</span>
              </div>
              <ResilienceGauge score={simState?.resilience ?? 0} size={140} />
            </div>
            <div className="bg-[#0a0d14] border border-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Energy & Sustainability</span>
              </div>
              <EnergyPanel energy={simState?.energy ?? null} />
            </div>
          </div>

          {/* Twin State + Forecast — spans 1 col */}
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

      {/* ── Alarm Feed ───────────────────────────────────────────── */}
      <div className="border-t border-zinc-800/60 bg-[#0a0d14] px-3 sm:px-4 py-2">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Alarm Feed</span>
            {simState && simState.alarms.length > 0 && (
              <span className="text-[9px] font-mono text-red-400">{simState.alarms.filter((a) => a.level === "critical").length} critical</span>
            )}
          </div>
          <AlarmFeed alarms={simState?.alarms ?? []} />
        </div>
      </div>

      {/* ── Station Drill-Down Panel ─────────────────────────────── */}
      {selectedStation && (
        <StationDrillDown
          stationId={selectedStation}
          simState={simState}
          scenario={scenario}
          history={stationHistory[selectedStation] ?? []}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}
