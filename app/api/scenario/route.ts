import { engine } from "@/lib/simulation";
import type { Scenario } from "@/lib/types";

const VALID_SCENARIOS: Scenario[] = ["normal", "peak", "event", "delay"];

export async function POST(request: Request) {
  const body = (await request.json()) as { scenario?: string; simTime?: number };

  if (!body.scenario || !VALID_SCENARIOS.includes(body.scenario as Scenario)) {
    return Response.json({ error: "invalid scenario" }, { status: 400 });
  }

  const scenario = body.scenario as Scenario;
  engine.setScenario(scenario);

  if (typeof body.simTime === "number") {
    engine.setSimTime(body.simTime);
  }

  return Response.json({ ok: true, scenario });
}
