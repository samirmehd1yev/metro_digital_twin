from __future__ import annotations

import random
import time
from typing import Any

import mesa

from .graph import STATIONS, G

SCENARIO_CONFIG = {
    "normal": {"max_agents": 22, "interval_min": 4, "system_load_base": 62, "twin_ahead_min": 12},
    "peak":   {"max_agents": 60, "interval_min": 2, "system_load_base": 85, "twin_ahead_min": 8},
    "event":  {"max_agents": 45, "interval_min": 3, "system_load_base": 78, "twin_ahead_min": 6},
    "delay":  {"max_agents": 18, "interval_min": 6, "system_load_base": 73, "twin_ahead_min": 4},
}

ROUTES = {
    "red_full": [
        "icherisheher", "sahil", "28-may", "ganjlik", "nariman-narimanov",
        "ulduz", "koroglu", "qara-qarayev", "neftchiler", "xalqlar-dostlugu",
        "ahmadli", "hazi-aslanov",
    ],
    "green_full": [
        "darnagul", "memar-ajami", "20-yanvar", "inshaatchilar",
        "elmler-akademiyasi", "nizami", "28-may", "ganjlik", "nariman-narimanov",
        "ulduz", "koroglu", "qara-qarayev", "neftchiler", "xalqlar-dostlugu",
        "ahmadli", "hazi-aslanov",
    ],
    "bakmil_shuttle": ["nariman-narimanov", "bakmil"],
    "purple_shuttle": ["xocasan", "avtovagzal", "8-noyabr", "memar-ajami"],
}


def _all_routes() -> list[list[str]]:
    routes: list[list[str]] = []
    for key, route in ROUTES.items():
        routes.append(route)
        routes.append(route[::-1])
    # Short runs
    for full in [ROUTES["red_full"], ROUTES["green_full"]]:
        for i in range(0, len(full) - 3, 3):
            length = random.randint(4, 6)
            sub = full[i : i + length]
            if len(sub) >= 4:
                routes.append(sub)
                routes.append(sub[::-1])
    return routes


VALID_ROUTES = _all_routes()


class PassengerAgent(mesa.Agent):
    def __init__(self, model: "MetroModel") -> None:
        super().__init__(model)
        self.route: list[str] = random.choice(VALID_ROUTES)
        self.edge_index: int = 0
        self.progress: float = random.random() * 0.5
        self.speed: float = 0.002 + random.random() * 0.003
        self.exhausted: bool = False

    def step(self) -> None:
        speed = self.speed

        # Delay scenario: slow down on Koroğlu ↔ Qara Qarayev
        if self.model.scenario == "delay" and self.edge_index < len(self.route) - 1:
            from_id = self.route[self.edge_index]
            to_id = self.route[self.edge_index + 1]
            if {from_id, to_id} == {"koroglu", "qara-qarayev"}:
                speed *= 0.07

        self.progress += speed

        if self.progress >= 1.0:
            self.edge_index += 1
            self.progress = 0.0

            if self.edge_index >= len(self.route) - 1:
                self.exhausted = True


class MetroModel(mesa.Model):
    def __init__(self, scenario: str = "normal") -> None:
        super().__init__()
        self.scenario: str = scenario
        self.sim_time_min: int = 480  # 08:00
        self.tick_count: int = 0
        self._synced_at: float = time.time()

        cfg = SCENARIO_CONFIG[self.scenario]
        for _ in range(cfg["max_agents"]):
            PassengerAgent(self)

    def step(self) -> None:
        self.tick_count += 1
        self.sim_time_min = (self.sim_time_min + 1) % 1440
        self._synced_at = time.time()

        cfg = SCENARIO_CONFIG[self.scenario]

        # Step all agents
        self.agents.shuffle_do("step")

        # Remove exhausted agents and respawn
        exhausted = [a for a in self.agents if isinstance(a, PassengerAgent) and a.exhausted]
        for a in exhausted:
            a.remove()
            PassengerAgent(self)

        # Adjust agent count
        current = len([a for a in self.agents if isinstance(a, PassengerAgent)])
        while current < cfg["max_agents"]:
            PassengerAgent(self)
            current += 1
        # Remove excess
        agents_list = [a for a in self.agents if isinstance(a, PassengerAgent)]
        while len(agents_list) > cfg["max_agents"]:
            agents_list[-1].remove()
            agents_list.pop()

    def compute_load(self, station_id: str) -> int:
        station = STATIONS.get(station_id)
        if not station:
            return 0

        base_pct = station["base_demand"] * 100
        scenario_mult = {"normal": 1.0, "peak": 1.65, "event": 1.3, "delay": 1.0}
        time_mult = 1.18 if (450 <= self.sim_time_min <= 570 or 1020 <= self.sim_time_min <= 1140) else 1.0

        special = 1.0
        if self.scenario == "event" and station_id in ("ahmadli", "hazi-aslanov"):
            special = 2.8
        if self.scenario == "delay" and station_id in ("koroglu", "qara-qarayev"):
            special = 2.1

        return min(99, round(base_pct * scenario_mult[self.scenario] * time_mult * special))

    def get_state(self) -> dict[str, Any]:
        cfg = SCENARIO_CONFIG[self.scenario]
        stations = []
        for sid, sdata in STATIONS.items():
            load = self.compute_load(sid)
            flow = round(sdata["capacity_per_hour"] * sdata["base_demand"] * (cfg["system_load_base"] / 100))
            stations.append({"id": sid, "load": load, "flow": flow})

        return {
            "tick": self.tick_count,
            "scenario": self.scenario,
            "simTime": self.sim_time_min,
            "stations": stations,
            "twinAheadMin": cfg["twin_ahead_min"],
            "syncedAgo": round(time.time() - self._synced_at),
        }
