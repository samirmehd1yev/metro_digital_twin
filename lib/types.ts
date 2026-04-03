export type Scenario = "normal" | "peak" | "event" | "delay";

export interface StationState {
  id: string;
  load: number;
  flow: number;
}

export interface SimState {
  tick: number;
  scenario: Scenario;
  simTime: number;
  stations: StationState[];
  twinAheadMin: number;
  syncedAgo: number;
}

export interface ForecastPoint {
  hour: string;
  flow: number;
}
