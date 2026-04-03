# Baku Metro Digital Twin

Real-time digital twin of the Baku Metro system. Simulates 21 stations across 3 lines (Red, Green, Purple) with shared trunk routing, scenario-based load modeling, and decision recommendations.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Vercel KV · Recharts · Zustand

## Local development

### 1. Clone and install

```bash
git clone https://github.com/samirmehd1yev/metro_digital_twin.git
cd metro_digital_twin
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values:

| Variable | Required | How to get it |
|----------|----------|---------------|
| `KV_REST_API_URL` | No (optional caching) | Go to [vercel.com/storage](https://vercel.com/storage) → Create a free KV database → Copy the `KV_REST_API_URL` from the `.env.local` tab |
| `KV_REST_API_TOKEN` | No (optional caching) | Same KV database page → Copy `KV_REST_API_TOKEN` from the `.env.local` tab |
| `NEXT_PUBLIC_TWIN_POLL_MS` | No (default: `2000`) | Polling interval in milliseconds. Controls how often the dashboard fetches new simulation state. Lower = more real-time, higher = less load |
| `NEXT_PUBLIC_API_BASE` | No | Leave empty for local mode. Set to your Railway backend URL (e.g. `https://metro-api.up.railway.app`) if using the FastAPI backend |
| `BACKEND_MODE` | No (default: `false`) | Set to `true` only if you deployed the FastAPI backend and want to proxy API calls to it |

> **Note:** The app works fully without any environment variables. KV is only used for caching state between requests. Without it, the simulation engine runs in-memory.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import this repository
3. In the Vercel dashboard, go to **Storage** tab → **Create** → **KV** (Upstash)
4. Connect the KV store to your project — Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`
5. Deploy — no other configuration needed

### Environment variables on Vercel

Go to **Project Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_TWIN_POLL_MS` | `2000` (or your preferred interval) |
| `KV_REST_API_URL` | Auto-injected if you connected KV storage |
| `KV_REST_API_TOKEN` | Auto-injected if you connected KV storage |

## Optional: FastAPI backend on Railway

For production use with real Mesa agent simulation:

1. Create a new project on [railway.app](https://railway.app)
2. Point the service to the `/backend` folder in this repo
3. Add a **Redis** service in Railway (click **+ New** → **Database** → **Redis**)
4. Set these environment variables on the backend service:

| Variable | Value |
|----------|-------|
| `REDIS_URL` | Copy from the Redis service's **Connect** tab (e.g. `redis://default:xxx@containers-us-west-xxx.railway.app:6379`) |
| `ALLOWED_ORIGIN` | Your Vercel deployment URL (e.g. `https://metro-twin.vercel.app`) |
| `PORT` | `8000` (Railway usually sets this automatically) |

5. Then on Vercel, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE` | Your Railway backend URL (e.g. `https://metro-api.up.railway.app`) |
| `BACKEND_MODE` | `true` |

## Scenarios

| Scenario | Key | Description |
|----------|-----|-------------|
| Adi gun | `normal` | Normal weekday traffic |
| Pik saat | `peak` | Rush hour — max agent count, 2 min intervals |
| Boyuk tadbir | `event` | Stadium event at Tofiq Bahramov — H.Aslanov surge |
| Qatar gecikmasi | `delay` | Train stuck on Koroglu → Qara Qarayev edge |

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/state` | Returns current simulation state (advances one tick) |
| `POST` | `/api/scenario` | Switch scenario: `{ "scenario": "peak", "simTime": 540 }` |
| `GET` | `/api/forecast?scenario=normal&fromHour=8` | Returns 7-hour passenger flow forecast |

## Hackathon demo tips

- Switch scenarios from the UI buttons or POST to `/api/scenario`
- The twin runs 4–12 minutes ahead of real time (`twinAheadMin`)
- Scenario `event` simulates Tofiq Bahramov stadium event — watch H.Aslanov surge
- Scenario `delay` blocks Koroglu → Qara Qarayev edge — watch cascade effect
- Drag the time slider to simulate different hours of the day
