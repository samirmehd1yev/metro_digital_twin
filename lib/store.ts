import { create } from "zustand";
import type { Scenario, SimState, ForecastPoint } from "./types";

interface TwinStore {
  simState: SimState | null;
  scenario: Scenario;
  simTimeMin: number;
  isLoading: boolean;
  lastError: string | null;
  forecastPoints: ForecastPoint[];

  setScenario: (s: Scenario) => void;
  setSimTime: (minutes: number) => void;
  fetchState: () => Promise<void>;
  fetchForecast: () => Promise<void>;
  startPolling: () => () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
let pollCount = 0;

export const useTwinStore = create<TwinStore>((set, get) => ({
  simState: null,
  scenario: "normal",
  simTimeMin: 480,
  isLoading: false,
  lastError: null,
  forecastPoints: [],

  setScenario: (s: Scenario) => {
    set({ scenario: s });
    fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: s }),
    }).catch(() => {});
  },

  setSimTime: (minutes: number) => {
    set({ simTimeMin: minutes });
    const { scenario } = get();
    fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, simTime: minutes }),
    }).catch(() => {});
  },

  fetchState: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SimState = await res.json();
      set({ simState: data, lastError: null, isLoading: false });
    } catch (err) {
      set({ lastError: (err as Error).message, isLoading: false });
    }
  },

  fetchForecast: async () => {
    const { scenario, simTimeMin } = get();
    const fromHour = Math.floor(simTimeMin / 60);
    try {
      const res = await fetch(
        `/api/forecast?scenario=${scenario}&fromHour=${fromHour}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      set({ forecastPoints: data.points ?? [] });
    } catch {
      // keep existing forecast
    }
  },

  startPolling: () => {
    // Clear any existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    const store = get();
    store.fetchState();
    store.fetchForecast();
    pollCount = 0;

    const ms = typeof window !== "undefined"
      ? parseInt(process.env.NEXT_PUBLIC_TWIN_POLL_MS || "2000", 10)
      : 2000;

    pollInterval = setInterval(() => {
      pollCount++;
      get().fetchState();
      if (pollCount % 10 === 0) {
        get().fetchForecast();
      }
    }, ms);

    // Return cleanup function
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  },
}));
