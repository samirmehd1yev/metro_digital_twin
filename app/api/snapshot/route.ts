import { computeSnapshot } from "@/lib/simulation";
import { SCENARIO_CONFIG } from "@/lib/simulation";
import type { Scenario } from "@/lib/types";

const VALID: Scenario[] = ["normal", "peak", "event", "delay"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = (searchParams.get("scenario") || "normal") as Scenario;
  const simTime = parseInt(searchParams.get("simTime") || "480", 10);

  if (!VALID.includes(scenario)) {
    return Response.json({ error: "invalid scenario" }, { status: 400 });
  }

  const stations = computeSnapshot(scenario, simTime);
  const avgLoad = stations.reduce((s, st) => s + st.load, 0) / stations.length;

  let resilience = 100;
  for (const st of stations) {
    if (st.load >= 90) resilience -= 6;
    else if (st.load >= 75) resilience -= 3;
    else if (st.load >= 60) resilience -= 1;
  }
  if (scenario === "delay") resilience -= 12;
  if (scenario === "event") resilience -= 8;
  if (scenario === "peak") resilience -= 5;
  resilience = Math.max(0, Math.min(100, resilience));

  const cfg = SCENARIO_CONFIG[scenario];

  return Response.json({
    tick: 0,
    scenario,
    simTime,
    stations,
    twinAheadMin: cfg.twinAheadMin,
    syncedAgo: 0,
    resilience,
    energy: {
      consumptionKwh: Math.round(cfg.maxAgents * 2.8 * 10) / 10,
      co2Tons: Math.round(cfg.maxAgents * 2.8 * 0.00042 * 1000) / 1000,
      regenPercent: scenario === "delay" ? 12 : 20,
      efficiencyScore: scenario === "delay" ? 68 : scenario === "peak" ? 82 : 92,
    },
    alarms: [],
  });
}
