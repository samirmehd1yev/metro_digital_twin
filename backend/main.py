from __future__ import annotations

import os
import pickle
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from simulation.agents import MetroModel, SCENARIO_CONFIG
from simulation.forecast import generate_forecast

app = FastAPI(title="Baku Metro Digital Twin API")

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Redis (optional) ──────────────────────────────────────────────
_redis_client = None

def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    try:
        import redis
        _redis_client = redis.from_url(redis_url)
        _redis_client.ping()
        return _redis_client
    except Exception:
        _redis_client = None
        return None


# ── Model persistence ─────────────────────────────────────────────
_model: MetroModel | None = None

def _get_model() -> MetroModel:
    global _model

    # Try Redis first
    r = _get_redis()
    if r:
        try:
            data = r.get("twin:model")
            if data:
                _model = pickle.loads(data)
                return _model
        except Exception:
            pass

    # Fallback to in-memory
    if _model is None:
        _model = MetroModel("normal")
    return _model


def _save_model(model: MetroModel) -> None:
    global _model
    _model = model
    r = _get_redis()
    if r:
        try:
            r.set("twin:model", pickle.dumps(model), ex=300)
        except Exception:
            pass


# ── Pydantic models ───────────────────────────────────────────────
class StationStateItem(BaseModel):
    id: str
    load: int
    flow: int


class SimStateResponse(BaseModel):
    tick: int
    scenario: str
    simTime: int
    stations: list[StationStateItem]
    twinAheadMin: int
    syncedAgo: int


class ScenarioRequest(BaseModel):
    scenario: str
    sim_time: Optional[int] = None


class ForecastPoint(BaseModel):
    hour: str
    flow: int


# ── Routes ────────────────────────────────────────────────────────
@app.get("/health")
def health():
    model = _get_model()
    return {"status": "ok", "tick": model.tick_count}


@app.get("/state", response_model=SimStateResponse)
def get_state():
    model = _get_model()
    model.step()
    _save_model(model)
    state = model.get_state()
    return SimStateResponse(**state)


@app.post("/scenario")
def set_scenario(req: ScenarioRequest):
    valid = {"normal", "peak", "event", "delay"}
    if req.scenario not in valid:
        return {"error": "invalid scenario"}

    model = _get_model()
    model.scenario = req.scenario
    if req.sim_time is not None:
        model.sim_time_min = req.sim_time
    _save_model(model)
    return {"ok": True, "scenario": req.scenario}


@app.get("/forecast")
def get_forecast(
    scenario: str = Query("normal"),
    fromHour: int = Query(8, ge=0, le=23),
):
    valid = {"normal", "peak", "event", "delay"}
    if scenario not in valid:
        return {"error": "invalid scenario"}

    # Check Redis cache
    r = _get_redis()
    cache_key = f"twin:forecast:{scenario}:{fromHour}"
    if r:
        try:
            cached = r.get(cache_key)
            if cached:
                import json
                return {"points": json.loads(cached), "scenario": scenario}
        except Exception:
            pass

    points = generate_forecast(scenario, fromHour)

    if r:
        try:
            import json
            r.set(cache_key, json.dumps(points), ex=300)
        except Exception:
            pass

    return {"points": points, "scenario": scenario}
