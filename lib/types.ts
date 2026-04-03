export type Scenario = "normal" | "peak" | "event" | "delay";
export type ViewMode = "topology" | "heatmap";

export interface StationState {
  id: string;
  load: number;
  flow: number;
}

export interface AlarmEntry {
  id: number;
  tick: number;
  level: "info" | "warning" | "critical";
  station: string;
  message: string;
}

export interface EnergyMetrics {
  consumptionKwh: number;
  co2Tons: number;
  regenPercent: number;
  efficiencyScore: number;
}

export interface SimState {
  tick: number;
  scenario: Scenario;
  simTime: number;
  stations: StationState[];
  twinAheadMin: number;
  syncedAgo: number;
  resilience: number;
  energy: EnergyMetrics;
  alarms: AlarmEntry[];
}

export interface ForecastPoint {
  hour: string;
  flow: number;
}
