# Baku Metro Digital Twin

Real-time digital twin of the Baku Metro system. Simulates 21 stations across 3 lines (Red, Green, Purple) with shared trunk routing, scenario-based load modeling, and decision recommendations.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Vercel KV · Recharts · Zustand

## Local development

1. Copy the env file and fill in credentials:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in Vercel KV credentials (create free KV at [vercel.com/storage](https://vercel.com/storage)), or leave blank to run without KV caching.
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add KV storage in Vercel dashboard (Storage tab → Create KV)
4. Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`
5. Deploy

## Optional: FastAPI backend on Railway

1. Create Railway project, point to `/backend` folder
2. Add Redis service in Railway
3. Set `REDIS_URL` and `ALLOWED_ORIGIN` env vars
4. Set `NEXT_PUBLIC_API_BASE` in Vercel to Railway URL
5. Set `BACKEND_MODE=true` in Vercel

## Scenarios

| Scenario | Key | Description |
|----------|-----|-------------|
| Adi gün | `normal` | Normal weekday traffic |
| Pik saat | `peak` | Rush hour — max agent count, 2 min intervals |
| Böyük tədbir | `event` | Stadium event at Tofiq Bəhramov — H.Aslanov surge |
| Qatar gecikməsi | `delay` | Train stuck on Koroğlu → Qara Qarayev edge |

## Hackathon demo tips

- `/api/scenario` POST lets you switch scenarios from the UI
- The twin runs 4–12 minutes ahead of real time (`twinAheadMin`)
- Scenario `event` simulates Tofiq Bəhramov stadium event
- Scenario `delay` blocks Koroğlu → Qara Qarayev edge
