import { create } from "zustand";
import type { Scenario, SimState, ForecastPoint, ViewMode } from "./types";

interface TwinStore {
  simState: SimState | null;
  scenario: Scenario;
  simTimeMin: number;
  isLoading: boolean;
  lastError: string | null;
  forecastPoints: ForecastPoint[];

  // Advanced features
  viewMode: ViewMode;
  isPlaying: boolean;
  playbackSpeed: number;
  selectedStation: string | null;
  compareMode: boolean;
  compareScenario: Scenario;
  compareState: SimState | null;
  stationHistory: Record<string, number[]>;

  // Actions
  setScenario: (s: Scenario) => void;
  setSimTime: (minutes: number) => void;
  fetchState: () => Promise<void>;
  fetchForecast: () => Promise<void>;
  startPolling: () => () => void;
  setViewMode: (mode: ViewMode) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedStation: (id: string | null) => void;
  setCompareMode: (on: boolean) => void;
  setCompareScenario: (s: Scenario) => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
let playbackInterval: ReturnType<typeof setInterval> | null = null;
let pollCount = 0;

export const useTwinStore = create<TwinStore>((set, get) => ({
  simState: null,
  scenario: "normal",
  simTimeMin: 480,
  isLoading: false,
  lastError: null,
  forecastPoints: [],

  viewMode: "topology",
  isPlaying: false,
  playbackSpeed: 1,
  selectedStation: null,
  compareMode: false,
  compareScenario: "peak",
  compareState: null,
  stationHistory: {},

  setScenario: (s: Scenario) => {
    set({ scenario: s });
    fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: s }),
    })
      .then(() => {
        get().fetchState();
        get().fetchForecast();
      })
      .catch(() => {});
  },

  setSimTime: (minutes: number) => {
    set({ simTimeMin: minutes });
    const { scenario } = get();
    fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, simTime: minutes }),
    })
      .then(() => {
        get().fetchState();
        get().fetchForecast();
      })
      .catch(() => {});
  },

  fetchState: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SimState = await res.json();

      // Update station history
      const history = { ...get().stationHistory };
      for (const st of data.stations) {
        if (!history[st.id]) history[st.id] = [];
        history[st.id].push(st.load);
        if (history[st.id].length > 60) history[st.id] = history[st.id].slice(-60);
      }

      set({ simState: data, lastError: null, isLoading: false, stationHistory: history });

      // Fetch compare state if compare mode is on
      if (get().compareMode) {
        const { compareScenario, simTimeMin } = get();
        try {
          const cRes = await fetch(`/api/snapshot?scenario=${compareScenario}&simTime=${simTimeMin}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            set({ compareState: cData });
          }
        } catch { /* ignore */ }
      }
    } catch (err) {
      set({ lastError: (err as Error).message, isLoading: false });
    }
  },

  fetchForecast: async () => {
    const { scenario, simTimeMin } = get();
    const fromHour = Math.floor(simTimeMin / 60);
    try {
      const res = await fetch(`/api/forecast?scenario=${scenario}&fromHour=${fromHour}`);
      if (!res.ok) return;
      const data = await res.json();
      set({ forecastPoints: data.points ?? [] });
    } catch { /* keep existing */ }
  },

  startPolling: () => {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }

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
      if (pollCount % 10 === 0) get().fetchForecast();
    }, ms);

    return () => {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      if (playbackInterval) { clearInterval(playbackInterval); playbackInterval = null; }
    };
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
    if (playbackInterval) { clearInterval(playbackInterval); playbackInterval = null; }

    if (playing) {
      playbackInterval = setInterval(() => {
        const { simTimeMin, playbackSpeed } = get();
        const next = (simTimeMin + playbackSpeed * 15) % 1440;
        get().setSimTime(next);
      }, 2000);
    }
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
    const { isPlaying } = get();
    if (isPlaying) {
      get().setPlaying(false);
      get().setPlaying(true);
    }
  },

  setSelectedStation: (id: string | null) => set({ selectedStation: id }),

  setCompareMode: (on: boolean) => {
    set({ compareMode: on, compareState: on ? get().compareState : null });
    if (on) get().fetchState();
  },

  setCompareScenario: (s: Scenario) => {
    set({ compareScenario: s });
    if (get().compareMode) get().fetchState();
  },
}));
