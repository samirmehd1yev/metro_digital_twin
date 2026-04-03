import { STATIONS, EDGES, ROUTES } from "./metro-graph";
import type { Scenario, SimState, StationState, ForecastPoint, AlarmEntry, EnergyMetrics } from "./types";

// ── Scenario configuration ────────────────────────────────────────
export const SCENARIO_CONFIG: Record<
  Scenario,
  { maxAgents: number; intervalMin: number; systemLoadBase: number; twinAheadMin: number }
> = {
  normal: { maxAgents: 22, intervalMin: 4, systemLoadBase: 62, twinAheadMin: 12 },
  peak:   { maxAgents: 60, intervalMin: 2, systemLoadBase: 85, twinAheadMin: 8 },
  event:  { maxAgents: 45, intervalMin: 3, systemLoadBase: 78, twinAheadMin: 6 },
  delay:  { maxAgents: 18, intervalMin: 6, systemLoadBase: 73, twinAheadMin: 4 },
};

// ── Agent types ───────────────────────────────────────────────────
interface Agent {
  id: number;
  route: string[];
  edgeIndex: number;
  progress: number;
  speed: number;
}

// ── Build all valid routes ────────────────────────────────────────
function allRoutes(): string[][] {
  const redFull = ROUTES.redFull;
  const greenFull = ROUTES.greenFull;
  const bakmil = ROUTES.bakmilShuttle;
  const purple = ROUTES.purpleShuttle;

  const routes: string[][] = [
    redFull, [...redFull].reverse(),
    greenFull, [...greenFull].reverse(),
    bakmil, [...bakmil].reverse(),
    purple, [...purple].reverse(),
  ];

  for (const full of [redFull, greenFull]) {
    for (let i = 0; i <= full.length - 4; i += 3) {
      const len = 4 + Math.floor(Math.random() * 3);
      const sub = full.slice(i, Math.min(i + len, full.length));
      if (sub.length >= 4) {
        routes.push(sub);
        routes.push([...sub].reverse());
      }
    }
  }

  return routes;
}

const VALID_ROUTES = allRoutes();

// ── Helpers ───────────────────────────────────────────────────────
let nextId = 1;
let nextAlarmId = 1;

function randomSpeed(): number {
  return 0.002 + Math.random() * 0.003;
}

function pickRoute(): string[] {
  return VALID_ROUTES[Math.floor(Math.random() * VALID_ROUTES.length)];
}

function spawnAgent(): Agent {
  const route = pickRoute();
  return { id: nextId++, route, edgeIndex: 0, progress: Math.random() * 0.5, speed: randomSpeed() };
}

// ── Station load computation ──────────────────────────────────────
function stationById(id: string) {
  return STATIONS.find((s) => s.id === id);
}

function computeLoad(stationId: string, scenario: Scenario, simTime: number): number {
  const station = stationById(stationId);
  if (!station) return 0;

  const basePct = station.baseDemand * 100;
  const scenarioMult: Record<Scenario, number> = { normal: 1.0, peak: 1.65, event: 1.3, delay: 1.0 };
  const timeMult = (simTime >= 450 && simTime <= 570) || (simTime >= 1020 && simTime <= 1140) ? 1.18 : 1.0;

  let special = 1.0;
  if (scenario === "event" && (stationId === "ahmadli" || stationId === "hazi-aslanov")) special = 2.8;
  if (scenario === "delay" && (stationId === "koroglu" || stationId === "qara-qarayev")) special = 2.1;

  return Math.min(99, Math.round(basePct * scenarioMult[scenario] * timeMult * special));
}

// ── Exported snapshot for compare mode ────────────────────────────
export function computeSnapshot(scenario: Scenario, simTime: number): StationState[] {
  return STATIONS.map((s) => ({
    id: s.id,
    load: computeLoad(s.id, scenario, simTime),
    flow: Math.round(s.capacityPerHour * s.baseDemand * (SCENARIO_CONFIG[scenario].systemLoadBase / 100)),
  }));
}

// ── Resilience computation ────────────────────────────────────────
function computeResilience(stations: StationState[], scenario: Scenario): number {
  let score = 100;
  for (const st of stations) {
    if (st.load >= 90) score -= 6;
    else if (st.load >= 75) score -= 3;
    else if (st.load >= 60) score -= 1;
  }
  if (scenario === "delay") score -= 12;
  if (scenario === "event") score -= 8;
  if (scenario === "peak") score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Energy computation ────────────────────────────────────────────
function computeEnergy(scenario: Scenario, agentCount: number): EnergyMetrics {
  const baseKwh = agentCount * 2.8;
  const scenarioMult: Record<Scenario, number> = { normal: 1.0, peak: 1.35, event: 1.2, delay: 1.15 };
  const consumptionKwh = Math.round(baseKwh * scenarioMult[scenario] * 10) / 10;
  const co2Tons = Math.round(consumptionKwh * 0.00042 * 1000) / 1000;
  const regenBase: Record<Scenario, number> = { normal: 22, peak: 18, event: 20, delay: 12 };
  const regenPercent = regenBase[scenario];
  const effBase: Record<Scenario, number> = { normal: 94, peak: 82, event: 86, delay: 68 };
  const efficiencyScore = effBase[scenario];
  return { consumptionKwh, co2Tons, regenPercent, efficiencyScore };
}

// ── Alarm generation ──────────────────────────────────────────────
function generateAlarms(stations: StationState[], scenario: Scenario, tick: number, prevAlarms: AlarmEntry[]): AlarmEntry[] {
  const alarms: AlarmEntry[] = [...prevAlarms];

  for (const st of stations) {
    const stationName = STATIONS.find((s) => s.id === st.id)?.name ?? st.id;
    const hasExisting = alarms.some((a) => a.station === st.id && a.tick > tick - 30);

    if (st.load >= 90 && !hasExisting) {
      alarms.push({
        id: nextAlarmId++, tick, level: "critical",
        station: st.id, message: `${stationName} at ${st.load}% — critical capacity`,
      });
    } else if (st.load >= 75 && st.load < 90 && !hasExisting) {
      alarms.push({
        id: nextAlarmId++, tick, level: "warning",
        station: st.id, message: `${stationName} approaching threshold at ${st.load}%`,
      });
    }
  }

  if (scenario === "delay" && tick % 15 === 0) {
    alarms.push({
      id: nextAlarmId++, tick, level: "critical",
      station: "koroglu", message: "Train stall persists on Koroglu-Q.Qarayev — cascade risk active",
    });
  }

  if (scenario === "event" && tick % 20 === 0) {
    alarms.push({
      id: nextAlarmId++, tick, level: "warning",
      station: "hazi-aslanov", message: "Stadium surge wave detected — deploying overflow routing",
    });
  }

  // Keep last 50 alarms
  return alarms.slice(-50);
}

// ── Forecast generator ────────────────────────────────────────────
const BASE_HOURLY_FLOW = [
  700, 500, 400, 400, 600, 1800, 5500, 8200, 6500, 4800, 4300,
  4500, 5800, 7600, 7100, 8800, 7800, 5500, 4400, 3800, 3200, 2600, 1900, 1200,
];

const FORECAST_MULTIPLIERS: Record<Scenario, number> = {
  normal: 1.0, peak: 1.55, event: 1.65, delay: 0.82,
};

export function generateForecast(scenario: Scenario, fromHour: number): ForecastPoint[] {
  const mult = FORECAST_MULTIPLIERS[scenario];
  const points: ForecastPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const h = (fromHour + i) % 24;
    points.push({ hour: `${String(h).padStart(2, "0")}:00`, flow: Math.round(BASE_HOURLY_FLOW[h] * mult) });
  }
  return points;
}

// ── Simulation Engine ─────────────────────────────────────────────
export class SimulationEngine {
  private agents: Agent[] = [];
  private _tick = 0;
  private _scenario: Scenario;
  private _simTime = 480;
  private _syncedAt = Date.now();
  private _alarms: AlarmEntry[] = [];

  constructor(scenario: Scenario) {
    this._scenario = scenario;
    this.initAgents();
  }

  private initAgents() {
    const cfg = SCENARIO_CONFIG[this._scenario];
    this.agents = [];
    for (let i = 0; i < cfg.maxAgents; i++) this.agents.push(spawnAgent());
  }

  tick(): SimState {
    this._tick++;
    this._simTime += 0.25;
    if (this._simTime >= 1440) this._simTime = 0;

    const cfg = SCENARIO_CONFIG[this._scenario];
    while (this.agents.length < cfg.maxAgents) this.agents.push(spawnAgent());
    while (this.agents.length > cfg.maxAgents) this.agents.pop();

    const toRemove: number[] = [];
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      let speed = agent.speed;

      // Delay scenario: Koroglu → Qara Qarayev slow down
      if (this._scenario === "delay" && agent.edgeIndex < agent.route.length - 1) {
        const from = agent.route[agent.edgeIndex];
        const to = agent.route[agent.edgeIndex + 1];
        if ((from === "koroglu" && to === "qara-qarayev") || (from === "qara-qarayev" && to === "koroglu")) {
          speed *= 0.07;
        }
      }

      agent.progress += speed;
      if (agent.progress >= 1) {
        agent.edgeIndex++;
        agent.progress = 0;
        if (agent.edgeIndex >= agent.route.length - 1) toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.agents.splice(toRemove[i], 1);
      this.agents.push(spawnAgent());
    }

    this._syncedAt = Date.now();
    return this.getState();
  }

  getState(): SimState {
    const stations: StationState[] = STATIONS.map((s) => ({
      id: s.id,
      load: computeLoad(s.id, this._scenario, this._simTime),
      flow: Math.round(s.capacityPerHour * s.baseDemand * (SCENARIO_CONFIG[this._scenario].systemLoadBase / 100)),
    }));

    const resilience = computeResilience(stations, this._scenario);
    const energy = computeEnergy(this._scenario, this.agents.length);
    this._alarms = generateAlarms(stations, this._scenario, this._tick, this._alarms);

    return {
      tick: this._tick,
      scenario: this._scenario,
      simTime: Math.round(this._simTime),
      stations,
      twinAheadMin: SCENARIO_CONFIG[this._scenario].twinAheadMin,
      syncedAgo: Math.round((Date.now() - this._syncedAt) / 1000),
      resilience,
      energy,
      alarms: this._alarms,
    };
  }

  setScenario(s: Scenario) {
    this._scenario = s;
    this._alarms = [];
    this.initAgents();
  }

  setSimTime(minutesFromMidnight: number) {
    this._simTime = minutesFromMidnight;
  }
}

export const engine = new SimulationEngine("normal");
