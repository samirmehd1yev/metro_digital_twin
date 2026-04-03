import { generateForecast } from "@/lib/simulation";
import type { Scenario } from "@/lib/types";

const VALID_SCENARIOS: Scenario[] = ["normal", "peak", "event", "delay"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = (searchParams.get("scenario") || "normal") as Scenario;
  const fromHour = parseInt(searchParams.get("fromHour") || "8", 10);

  if (!VALID_SCENARIOS.includes(scenario) || fromHour < 0 || fromHour > 23) {
    return Response.json({ error: "invalid params" }, { status: 400 });
  }

  const points = generateForecast(scenario, fromHour);

  return Response.json({ points });
}
