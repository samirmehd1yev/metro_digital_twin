import { engine } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.BACKEND_MODE === "true" && process.env.NEXT_PUBLIC_API_BASE) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/state`);
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const state = engine.tick();

  return Response.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
