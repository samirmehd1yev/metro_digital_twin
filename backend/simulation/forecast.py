BASE_HOURLY_FLOW = [
    700, 500, 400, 400, 600, 1800, 5500, 8200, 6500, 4800, 4300,
    4500, 5800, 7600, 7100, 8800, 7800, 5500, 4400, 3800, 3200, 2600, 1900, 1200,
]

MULTIPLIERS = {
    "normal": 1.0,
    "peak": 1.55,
    "event": 1.65,
    "delay": 0.82,
}


def generate_forecast(scenario: str, from_hour: int) -> list[dict]:
    mult = MULTIPLIERS.get(scenario, 1.0)
    points = []
    for i in range(7):
        h = (from_hour + i) % 24
        points.append({
            "hour": f"{h:02d}:00",
            "flow": round(BASE_HOURLY_FLOW[h] * mult),
        })
    return points
