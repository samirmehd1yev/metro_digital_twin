import { kv } from "@vercel/kv";
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

  const cacheKey = `twin:forecast:${scenario}:${fromHour}`;

  try {
    const cached = await kv.get<string>(cacheKey);
    if (cached) {
      return Response.json({ points: JSON.parse(cached as string) });
    }
  } catch {
    // KV unavailable
  }

  const points = generateForecast(scenario, fromHour);

  try {
    await kv.set(cacheKey, JSON.stringify(points), { ex: 300 });
  } catch {
    // KV unavailable
  }

  return Response.json({ points });
}
