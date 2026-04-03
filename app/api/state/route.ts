import { kv } from "@vercel/kv";
import { engine } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  // Backend mode: proxy to FastAPI
  if (process.env.BACKEND_MODE === "true" && process.env.NEXT_PUBLIC_API_BASE) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/state`);
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Local TS simulation engine
  const state = engine.tick();

  try {
    await kv.set("twin:state", JSON.stringify(state), { ex: 30 });
  } catch {
    // KV unavailable — continue without caching
  }

  return Response.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
