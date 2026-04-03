import networkx as nx

STATIONS = {
    "icherisheher":       {"name_az": "İçərişəhər",           "x": 85,  "y": 210, "capacity_per_hour": 8000,  "line": "red",    "base_demand": 0.45},
    "sahil":              {"name_az": "Sahil",                 "x": 175, "y": 210, "capacity_per_hour": 9500,  "line": "red",    "base_demand": 0.55},
    "28-may":             {"name_az": "28 May",                "x": 268, "y": 210, "capacity_per_hour": 14000, "line": "shared", "base_demand": 0.72},
    "ganjlik":            {"name_az": "Gənclik",               "x": 350, "y": 210, "capacity_per_hour": 9000,  "line": "shared", "base_demand": 0.50},
    "nariman-narimanov":  {"name_az": "Nəriman Nərimanov",     "x": 428, "y": 210, "capacity_per_hour": 10000, "line": "shared", "base_demand": 0.58},
    "ulduz":              {"name_az": "Ulduz",                 "x": 502, "y": 210, "capacity_per_hour": 8500,  "line": "shared", "base_demand": 0.42},
    "koroglu":            {"name_az": "Koroğlu",               "x": 572, "y": 210, "capacity_per_hour": 11000, "line": "shared", "base_demand": 0.65},
    "qara-qarayev":       {"name_az": "Qara Qarayev",          "x": 572, "y": 263, "capacity_per_hour": 10500, "line": "shared", "base_demand": 0.60},
    "neftchiler":         {"name_az": "Neftçilər",             "x": 500, "y": 263, "capacity_per_hour": 8000,  "line": "shared", "base_demand": 0.40},
    "xalqlar-dostlugu":   {"name_az": "Xalqlar Dostluğu",     "x": 428, "y": 263, "capacity_per_hour": 9000,  "line": "shared", "base_demand": 0.48},
    "ahmadli":            {"name_az": "Əhmədli",               "x": 356, "y": 263, "capacity_per_hour": 9500,  "line": "shared", "base_demand": 0.52},
    "hazi-aslanov":       {"name_az": "Həzi Aslanov",          "x": 284, "y": 263, "capacity_per_hour": 12000, "line": "shared", "base_demand": 0.68},
    "bakmil":             {"name_az": "Bakmil",                "x": 428, "y": 148, "capacity_per_hour": 5000,  "line": "red",    "base_demand": 0.25},
    "nizami":             {"name_az": "Nizami",                "x": 232, "y": 162, "capacity_per_hour": 9000,  "line": "green",  "base_demand": 0.50},
    "elmler-akademiyasi": {"name_az": "Elmlər Akademiyası",    "x": 190, "y": 122, "capacity_per_hour": 7500,  "line": "green",  "base_demand": 0.38},
    "inshaatchilar":      {"name_az": "İnşaatçılar",           "x": 148, "y": 92,  "capacity_per_hour": 7000,  "line": "green",  "base_demand": 0.35},
    "20-yanvar":          {"name_az": "20 Yanvar",             "x": 108, "y": 72,  "capacity_per_hour": 8000,  "line": "green",  "base_demand": 0.40},
    "memar-ajami":        {"name_az": "Memar Əcəmi",           "x": 68,  "y": 72,  "capacity_per_hour": 10000, "line": "green",  "base_demand": 0.55},
    "darnagul":           {"name_az": "Dərnəgül",              "x": 35,  "y": 72,  "capacity_per_hour": 6000,  "line": "green",  "base_demand": 0.30},
    "8-noyabr":           {"name_az": "8 Noyabr",              "x": 68,  "y": 38,  "capacity_per_hour": 6500,  "line": "purple", "base_demand": 0.28},
    "avtovagzal":         {"name_az": "Avtovağzal",            "x": 108, "y": 38,  "capacity_per_hour": 7000,  "line": "purple", "base_demand": 0.35},
    "xocasan":            {"name_az": "Xocəsən",               "x": 148, "y": 38,  "capacity_per_hour": 5500,  "line": "purple", "base_demand": 0.22},
}

EDGES = [
    # Red
    ("icherisheher", "sahil", {"line_type": "red", "distance_m": 1200}),
    ("sahil", "icherisheher", {"line_type": "red", "distance_m": 1200}),
    ("sahil", "28-may", {"line_type": "red", "distance_m": 1000}),
    ("28-may", "sahil", {"line_type": "red", "distance_m": 1000}),
    # Green
    ("darnagul", "memar-ajami", {"line_type": "green", "distance_m": 800}),
    ("memar-ajami", "darnagul", {"line_type": "green", "distance_m": 800}),
    ("memar-ajami", "20-yanvar", {"line_type": "green", "distance_m": 900}),
    ("20-yanvar", "memar-ajami", {"line_type": "green", "distance_m": 900}),
    ("20-yanvar", "inshaatchilar", {"line_type": "green", "distance_m": 850}),
    ("inshaatchilar", "20-yanvar", {"line_type": "green", "distance_m": 850}),
    ("inshaatchilar", "elmler-akademiyasi", {"line_type": "green", "distance_m": 1000}),
    ("elmler-akademiyasi", "inshaatchilar", {"line_type": "green", "distance_m": 1000}),
    ("elmler-akademiyasi", "nizami", {"line_type": "green", "distance_m": 950}),
    ("nizami", "elmler-akademiyasi", {"line_type": "green", "distance_m": 950}),
    ("nizami", "28-may", {"line_type": "green", "distance_m": 1100}),
    ("28-may", "nizami", {"line_type": "green", "distance_m": 1100}),
    # Shared trunk
    ("28-may", "ganjlik", {"line_type": "shared", "distance_m": 1000}),
    ("ganjlik", "28-may", {"line_type": "shared", "distance_m": 1000}),
    ("ganjlik", "nariman-narimanov", {"line_type": "shared", "distance_m": 1100}),
    ("nariman-narimanov", "ganjlik", {"line_type": "shared", "distance_m": 1100}),
    ("nariman-narimanov", "ulduz", {"line_type": "shared", "distance_m": 950}),
    ("ulduz", "nariman-narimanov", {"line_type": "shared", "distance_m": 950}),
    ("ulduz", "koroglu", {"line_type": "shared", "distance_m": 900}),
    ("koroglu", "ulduz", {"line_type": "shared", "distance_m": 900}),
    ("koroglu", "qara-qarayev", {"line_type": "shared", "distance_m": 800}),
    ("qara-qarayev", "koroglu", {"line_type": "shared", "distance_m": 800}),
    ("qara-qarayev", "neftchiler", {"line_type": "shared", "distance_m": 950}),
    ("neftchiler", "qara-qarayev", {"line_type": "shared", "distance_m": 950}),
    ("neftchiler", "xalqlar-dostlugu", {"line_type": "shared", "distance_m": 1000}),
    ("xalqlar-dostlugu", "neftchiler", {"line_type": "shared", "distance_m": 1000}),
    ("xalqlar-dostlugu", "ahmadli", {"line_type": "shared", "distance_m": 1050}),
    ("ahmadli", "xalqlar-dostlugu", {"line_type": "shared", "distance_m": 1050}),
    ("ahmadli", "hazi-aslanov", {"line_type": "shared", "distance_m": 900}),
    ("hazi-aslanov", "ahmadli", {"line_type": "shared", "distance_m": 900}),
    # Bakmil branch
    ("nariman-narimanov", "bakmil", {"line_type": "red", "distance_m": 700}),
    ("bakmil", "nariman-narimanov", {"line_type": "red", "distance_m": 700}),
    # Purple
    ("memar-ajami", "8-noyabr", {"line_type": "purple", "distance_m": 600}),
    ("8-noyabr", "memar-ajami", {"line_type": "purple", "distance_m": 600}),
    ("8-noyabr", "avtovagzal", {"line_type": "purple", "distance_m": 750}),
    ("avtovagzal", "8-noyabr", {"line_type": "purple", "distance_m": 750}),
    ("avtovagzal", "xocasan", {"line_type": "purple", "distance_m": 800}),
    ("xocasan", "avtovagzal", {"line_type": "purple", "distance_m": 800}),
]


def build_graph() -> nx.DiGraph:
    G = nx.DiGraph()
    for station_id, attrs in STATIONS.items():
        G.add_node(station_id, **attrs)
    for u, v, attrs in EDGES:
        G.add_edge(u, v, **attrs)
    return G


G = build_graph()
