#!/usr/bin/env python3
"""
Smart Garden Analysis Engine for GardenSaaS.

Analyzes garden configuration, weather data, companion planting, and generates
planting plans, alerts, and harvest schedules.

Usage:
    python scripts/garden_analyzer.py --config garden.json
    echo '{"latitude": 48.85, ...}' | python scripts/garden_analyzer.py

Sample config JSON:
{
    "length_m": 10,
    "width_m": 6,
    "soil_type": "loamy",
    "climate_zone": "temperate",
    "sun_exposure": "full-sun",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "setup_type": "new",
    "has_raised_beds": false,
    "has_greenhouse": false,
    "existing_plants": []
}

Existing garden example:
{
    "length_m": 8,
    "width_m": 5,
    "soil_type": "loamy",
    "climate_zone": "temperate",
    "sun_exposure": "full-sun",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "setup_type": "existing",
    "has_raised_beds": true,
    "has_greenhouse": false,
    "existing_plants": [
        {"plant_id": "tomato", "position": {"x": 20, "z": 30}, "planted_date": "2026-03-01"},
        {"plant_id": "basil", "position": {"x": 25, "z": 30}, "planted_date": "2026-03-05"}
    ]
}

Output: JSON to stdout with planting_plan, alerts, weather_summary,
        companion_analysis, harvest_schedule.
"""

import argparse
import json
import math
import os
import sys
from datetime import datetime, timedelta
from typing import Any

try:
    import requests
except ImportError:
    sys.stderr.write("Error: 'requests' package required. Install with: pip install requests\n")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PLANTS_JSON_PATH = os.path.join(SCRIPT_DIR, "..", "src", "data", "plants.json")

WATERING_INTERVAL_DAYS = {
    "daily": 1,
    "every-2-days": 2,
    "twice-weekly": 3,
    "weekly": 7,
}

# Climate zone to approximate frost temperature threshold (Celsius)
FROST_THRESHOLDS = {
    "tropical": -1,
    "subtropical": 0,
    "mediterranean": 1,
    "temperate": 2,
    "continental": 3,
    "subarctic": 4,
}

HEAT_STRESS_TEMP = 35  # Celsius

# Season mapping by month (Northern hemisphere)
SEASON_BY_MONTH = {
    1: "winter", 2: "winter", 3: "spring", 4: "spring",
    5: "spring", 6: "summer", 7: "summer", 8: "summer",
    9: "autumn", 10: "autumn", 11: "autumn", 12: "winter",
}

# Raised bed bonus: some plants grow better in raised beds
RAISED_BED_PREFERRED = {
    "carrot", "radish", "lettuce", "spinach", "beet", "herb",
    "strawberry", "basil", "parsley", "chives", "thyme", "oregano",
}

# Greenhouse preference: heat-loving plants
GREENHOUSE_PREFERRED = {
    "tomato", "pepper", "eggplant", "cucumber", "zucchini",
    "basil", "melon", "watermelon",
}


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_plants() -> dict[str, dict]:
    """Load plants.json and return a dict keyed by plant id."""
    path = os.path.normpath(PLANTS_JSON_PATH)
    if not os.path.exists(path):
        sys.stderr.write(f"Error: plants.json not found at {path}\n")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        plants_list = json.load(f)
    return {p["id"]: p for p in plants_list}


# ---------------------------------------------------------------------------
# Weather
# ---------------------------------------------------------------------------

def fetch_weather(lat: float, lng: float) -> dict[str, Any] | None:
    """Fetch current and 7-day forecast from Open-Meteo, including past 7 days."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode"
        f"&timezone=auto&past_days=7"
    )
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        sys.stderr.write(f"Warning: weather fetch failed: {e}\n")
        return None


def parse_weather(raw: dict | None) -> dict[str, Any]:
    """Parse Open-Meteo response into structured weather summary."""
    if raw is None:
        return {
            "current": None,
            "forecast_7d": [],
            "watering_needed": True,
            "rainfall_last_7d_mm": 0,
            "frost_risk": False,
            "heat_stress": False,
        }

    current = raw.get("current", {})
    daily = raw.get("daily", {})

    current_temp = current.get("temperature_2m")
    current_humidity = current.get("relative_humidity_2m")
    current_precip = current.get("precipitation", 0)
    current_wind = current.get("wind_speed_10m", 0)

    # Parse daily arrays
    dates = daily.get("time", [])
    maxs = daily.get("temperature_2m_max", [])
    mins = daily.get("temperature_2m_min", [])
    precips = daily.get("precipitation_sum", [])
    codes = daily.get("weathercode", [])

    today_str = datetime.now().strftime("%Y-%m-%d")

    # Split into past (last 7 days) and future (next 7 days)
    past_precip = 0.0
    forecast_7d = []
    for i, d in enumerate(dates):
        p = precips[i] if i < len(precips) else 0
        if d <= today_str:
            past_precip += p
        else:
            if len(forecast_7d) < 7:
                forecast_7d.append({
                    "date": d,
                    "temp_max": maxs[i] if i < len(maxs) else None,
                    "temp_min": mins[i] if i < len(mins) else None,
                    "precipitation_mm": p,
                    "weathercode": codes[i] if i < len(codes) else None,
                })

    # Determine frost risk (any forecast min below 2C)
    frost_risk = any(
        (f["temp_min"] is not None and f["temp_min"] <= 2) for f in forecast_7d
    )

    # Heat stress
    heat_stress = any(
        (f["temp_max"] is not None and f["temp_max"] >= HEAT_STRESS_TEMP)
        for f in forecast_7d
    )

    # Watering: needed if past 7 day rainfall < 15mm and no heavy rain forecast
    upcoming_rain = sum(f["precipitation_mm"] for f in forecast_7d[:3])
    watering_needed = past_precip < 15 and upcoming_rain < 10

    return {
        "current": {
            "temperature": current_temp,
            "humidity": current_humidity,
            "precipitation": current_precip,
            "wind_speed": current_wind,
        },
        "forecast_7d": forecast_7d,
        "watering_needed": watering_needed,
        "rainfall_last_7d_mm": round(past_precip, 1),
        "frost_risk": frost_risk,
        "heat_stress": heat_stress,
    }


# ---------------------------------------------------------------------------
# Companion planting analysis
# ---------------------------------------------------------------------------

def analyze_companions(
    plant_ids: list[str], plants_db: dict[str, dict]
) -> list[dict]:
    """Check all pairs of plants for companion/enemy relationships."""
    results = []
    checked = set()
    for pid_a in plant_ids:
        pa = plants_db.get(pid_a)
        if not pa:
            continue
        for pid_b in plant_ids:
            if pid_a == pid_b:
                continue
            pair = tuple(sorted([pid_a, pid_b]))
            if pair in checked:
                continue
            checked.add(pair)

            pb = plants_db.get(pid_b)
            if not pb:
                continue

            name_a = pa["name"].get("fr", pa["name"].get("en", pid_a))
            name_b = pb["name"].get("fr", pb["name"].get("en", pid_b))

            if pid_b in pa.get("companionPlants", []) or pid_a in pb.get("companionPlants", []):
                results.append({
                    "plant_a": pid_a,
                    "plant_b": pid_b,
                    "relationship": "good",
                    "note": f"{name_a} et {name_b} sont de bons compagnons.",
                })
            elif pid_b in pa.get("enemyPlants", []) or pid_a in pb.get("enemyPlants", []):
                results.append({
                    "plant_a": pid_a,
                    "plant_b": pid_b,
                    "relationship": "bad",
                    "note": f"{name_a} et {name_b} ne doivent pas etre plantes ensemble.",
                })
    return results


# ---------------------------------------------------------------------------
# Growth stage & harvest schedule
# ---------------------------------------------------------------------------

def compute_harvest_schedule(
    existing_plants: list[dict], plants_db: dict[str, dict], now: datetime
) -> list[dict]:
    """For each existing plant, compute estimated harvest date and days remaining."""
    schedule = []
    for ep in existing_plants:
        pid = ep["plant_id"]
        plant = plants_db.get(pid)
        if not plant:
            continue
        planted_str = ep.get("planted_date")
        if not planted_str:
            continue
        try:
            planted_dt = datetime.strptime(planted_str, "%Y-%m-%d")
        except ValueError:
            continue
        harvest_days = plant.get("harvestDays", 90)
        est_harvest = planted_dt + timedelta(days=harvest_days)
        days_remaining = (est_harvest - now).days
        schedule.append({
            "plant_id": pid,
            "planted_date": planted_str,
            "estimated_harvest_date": est_harvest.strftime("%Y-%m-%d"),
            "days_remaining": max(days_remaining, 0),
            "harvest_ready": days_remaining <= 0,
        })
    return schedule


# ---------------------------------------------------------------------------
# Planting plan for NEW gardens
# ---------------------------------------------------------------------------

def _is_plantable(plant: dict, config: dict, current_month: int) -> bool:
    """Check if a plant is suitable for the garden conditions and current season."""
    # Soil compatibility
    if config["soil_type"] not in plant.get("soilTypes", []):
        return False
    # Sun compatibility
    if config["sun_exposure"] not in plant.get("sunExposure", []):
        return False
    # Planting month (allow 1 month before/after for greenhouse)
    planting_months = plant.get("plantingMonths", [])
    if config.get("has_greenhouse"):
        expanded = set()
        for m in planting_months:
            expanded.update([((m - 2) % 12) + 1, m, (m % 12) + 1])
        planting_months = list(expanded)
    if current_month not in planting_months:
        return False
    return True


def _score_plant(plant: dict, config: dict, selected_ids: list[str]) -> float:
    """Score a plant 0-100 based on how well it fits the garden context."""
    score = 50.0

    # Difficulty bonus
    diff = plant.get("difficulty", "medium")
    if diff == "easy":
        score += 15
    elif diff == "hard":
        score -= 10

    # Companion bonus: more companions already selected = higher score
    companions = set(plant.get("companionPlants", []))
    enemies = set(plant.get("enemyPlants", []))
    companion_overlap = len(companions & set(selected_ids))
    enemy_overlap = len(enemies & set(selected_ids))
    score += companion_overlap * 10
    score -= enemy_overlap * 20

    # Category diversity bonus
    score += 5  # base diversity

    # Greenhouse preference
    if config.get("has_greenhouse") and plant["id"] in GREENHOUSE_PREFERRED:
        score += 10

    # Raised bed preference
    if config.get("has_raised_beds"):
        cat = plant.get("category", "")
        if plant["id"] in RAISED_BED_PREFERRED or cat == "herb":
            score += 8

    return max(0, min(100, score))


def generate_planting_plan(
    config: dict, plants_db: dict[str, dict], weather: dict
) -> list[dict]:
    """Generate an optimal planting plan for a new garden."""
    now = datetime.now()
    current_month = now.month

    length_m = config["length_m"]
    width_m = config["width_m"]
    area_m2 = length_m * width_m

    # Filter plantable species
    candidates = []
    for pid, plant in plants_db.items():
        # Skip variant plants (those with hyphens that reference a base plant)
        # Only use base-level plants for the plan to avoid duplicates
        if _is_plantable(plant, config, current_month):
            candidates.append(plant)

    if not candidates:
        return []

    # Score and rank
    selected_ids: list[str] = []
    scored = []
    for plant in candidates:
        s = _score_plant(plant, config, selected_ids)
        scored.append((s, plant))
    scored.sort(key=lambda x: -x[0])

    # Select top plants, iteratively refining scores
    plan = []
    used_area_cm2 = 0.0
    total_area_cm2 = area_m2 * 10000  # convert m2 to cm2

    # Reserve some area if raised beds / greenhouse
    usable_fraction = 0.75  # paths, borders
    if config.get("has_raised_beds"):
        usable_fraction = 0.80
    max_area_cm2 = total_area_cm2 * usable_fraction

    # Place plants grid-style
    cursor_x_cm = 30  # start offset in cm
    cursor_z_cm = 30
    row_max_height = 0

    for _, plant in scored[:20]:  # Consider top 20 candidates
        pid = plant["id"]

        # Check for enemy conflicts
        enemies = set(plant.get("enemyPlants", []))
        if enemies & set(selected_ids):
            continue

        spacing = plant.get("spacingCm", 40)
        row_spacing = plant.get("rowSpacingCm", int(spacing * 1.5))

        # Determine quantity based on available space and plant type
        category = plant.get("category", "vegetable")
        if category == "herb":
            max_qty = 3
        elif category == "fruit":
            max_qty = 4
        elif pid in ("pumpkin", "watermelon", "corn"):
            max_qty = 3
        else:
            max_qty = max(2, min(8, int(area_m2 / 3)))

        # Place plants
        placed = 0
        positions = []
        for _ in range(max_qty):
            if cursor_x_cm + spacing > length_m * 100 - 30:
                # Next row
                cursor_x_cm = 30
                cursor_z_cm += row_max_height + 20
                row_max_height = 0

            if cursor_z_cm + row_spacing > width_m * 100 - 30:
                break  # No more room

            if used_area_cm2 > max_area_cm2:
                break

            # Convert to percent (0-100) for garden coordinates
            x_pct = round((cursor_x_cm / (length_m * 100)) * 100, 1)
            z_pct = round((cursor_z_cm / (width_m * 100)) * 100, 1)
            positions.append({"x": x_pct, "z": z_pct})

            cursor_x_cm += spacing
            row_max_height = max(row_max_height, row_spacing)
            used_area_cm2 += spacing * row_spacing
            placed += 1

        if placed > 0:
            name_fr = plant["name"].get("fr", plant["name"].get("en", pid))
            companions = plant.get("companionPlants", [])
            comp_names = []
            for cid in companions[:3]:
                cp = plants_db.get(cid)
                if cp:
                    comp_names.append(cp["name"].get("fr", cid))

            reason_parts = [f"Adapte au sol {config['soil_type']}"]
            if comp_names:
                reason_parts.append(f"bon compagnon de {', '.join(comp_names)}")
            if config.get("has_greenhouse") and pid in GREENHOUSE_PREFERRED:
                reason_parts.append("ideal en serre")
            if config.get("has_raised_beds") and (pid in RAISED_BED_PREFERRED or category == "herb"):
                reason_parts.append("parfait en bac sureleve")

            plan.append({
                "plant_id": pid,
                "name": name_fr,
                "positions": positions,
                "quantity": placed,
                "spacing_cm": spacing,
                "reason": ". ".join(reason_parts) + ".",
            })
            selected_ids.append(pid)

    return plan


# ---------------------------------------------------------------------------
# Existing garden improvements
# ---------------------------------------------------------------------------

def suggest_improvements(
    config: dict, plants_db: dict[str, dict], companion_analysis: list[dict],
    harvest_schedule: list[dict]
) -> list[dict]:
    """Suggest improvements for an existing garden."""
    suggestions = []
    existing_ids = [ep["plant_id"] for ep in config.get("existing_plants", [])]
    now = datetime.now()
    current_month = now.month

    # 1. Flag bad companions
    for ca in companion_analysis:
        if ca["relationship"] == "bad":
            suggestions.append({
                "type": "move",
                "plant_id": ca["plant_a"],
                "message": f"Deplacer {ca['plant_a']} loin de {ca['plant_b']} (mauvais voisinage).",
                "urgency": "medium",
            })

    # 2. Suggest missing good companions
    for pid in existing_ids:
        plant = plants_db.get(pid)
        if not plant:
            continue
        for comp_id in plant.get("companionPlants", []):
            if comp_id not in existing_ids:
                comp = plants_db.get(comp_id)
                if comp and _is_plantable(comp, config, current_month):
                    comp_name = comp["name"].get("fr", comp_id)
                    plant_name = plant["name"].get("fr", pid)
                    suggestions.append({
                        "type": "add",
                        "plant_id": comp_id,
                        "message": f"Ajouter {comp_name} comme compagnon de {plant_name}.",
                        "urgency": "low",
                    })

    # 3. Harvest-ready plants
    for hs in harvest_schedule:
        if hs["harvest_ready"]:
            plant = plants_db.get(hs["plant_id"])
            name = plant["name"].get("fr", hs["plant_id"]) if plant else hs["plant_id"]
            suggestions.append({
                "type": "harvest",
                "plant_id": hs["plant_id"],
                "message": f"{name} est pret a etre recolte !",
                "urgency": "high",
            })

    # Deduplicate suggestions by (type, plant_id)
    seen = set()
    unique = []
    for s in suggestions:
        key = (s["type"], s["plant_id"])
        if key not in seen:
            seen.add(key)
            unique.append(s)
    return unique


# ---------------------------------------------------------------------------
# Notification generation
# ---------------------------------------------------------------------------

def generate_alerts(
    config: dict, plants_db: dict[str, dict], weather: dict,
    harvest_schedule: list[dict], companion_analysis: list[dict]
) -> list[dict]:
    """Generate notification alerts in French."""
    alerts = []
    now = datetime.now()
    current_month = now.month

    # Weather-based alerts
    if weather.get("frost_risk"):
        alerts.append({
            "type": "frost",
            "urgency": "high",
            "message": "Alerte gel ! Des temperatures proches de 0\u00b0C sont prevues. Protegez vos plantes sensibles.",
            "plant_id": None,
        })

    if weather.get("heat_stress"):
        alerts.append({
            "type": "warning",
            "urgency": "high",
            "message": f"Canicule prevue (>{HEAT_STRESS_TEMP}\u00b0C). Arrosez abondamment le matin et le soir, paillez le sol.",
            "plant_id": None,
        })

    if weather.get("watering_needed"):
        # Determine which plants need water most
        all_ids = [ep["plant_id"] for ep in config.get("existing_plants", [])]
        if not all_ids:
            # New garden, general alert
            alerts.append({
                "type": "water",
                "urgency": "medium",
                "message": "Peu de pluie recente. Pensez a arroser votre jardin.",
                "plant_id": None,
            })
        else:
            # Per-plant watering
            for pid in set(all_ids):
                plant = plants_db.get(pid)
                if not plant:
                    continue
                freq = plant.get("wateringFrequency", "weekly")
                interval = WATERING_INTERVAL_DAYS.get(freq, 7)
                name = plant["name"].get("fr", pid)
                if interval <= 2:
                    urgency = "high"
                elif interval <= 3:
                    urgency = "medium"
                else:
                    urgency = "low"
                alerts.append({
                    "type": "water",
                    "urgency": urgency,
                    "message": f"{name} a besoin d'eau ({freq.replace('-', ' ')}). Precipitations insuffisantes.",
                    "plant_id": pid,
                })

    # Harvest alerts
    for hs in harvest_schedule:
        if hs["harvest_ready"]:
            plant = plants_db.get(hs["plant_id"])
            name = plant["name"].get("fr", hs["plant_id"]) if plant else hs["plant_id"]
            alerts.append({
                "type": "harvest",
                "urgency": "high",
                "message": f"{name} est pret pour la recolte ! Plante le {hs['planted_date']}.",
                "plant_id": hs["plant_id"],
            })
        elif 0 < hs["days_remaining"] <= 7:
            plant = plants_db.get(hs["plant_id"])
            name = plant["name"].get("fr", hs["plant_id"]) if plant else hs["plant_id"]
            alerts.append({
                "type": "harvest",
                "urgency": "medium",
                "message": f"{name} sera pret dans {hs['days_remaining']} jours.",
                "plant_id": hs["plant_id"],
            })

    # Companion conflict alerts
    for ca in companion_analysis:
        if ca["relationship"] == "bad":
            alerts.append({
                "type": "warning",
                "urgency": "medium",
                "message": ca["note"],
                "plant_id": ca["plant_a"],
            })

    # Seasonal planting suggestions
    season = SEASON_BY_MONTH.get(current_month, "spring")
    if season == "spring":
        alerts.append({
            "type": "plant",
            "urgency": "low",
            "message": "C'est le printemps ! Periode ideale pour planter tomates, courgettes et haricots.",
            "plant_id": None,
        })
    elif season == "autumn":
        alerts.append({
            "type": "plant",
            "urgency": "low",
            "message": "L'automne arrive. Pensez a planter ail, oignon et epinard pour l'hiver.",
            "plant_id": None,
        })
    elif season == "winter":
        alerts.append({
            "type": "warning",
            "urgency": "low",
            "message": "Periode hivernale. Protegez vos plantes du gel et planifiez le printemps.",
            "plant_id": None,
        })

    return alerts


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def validate_config(config: dict) -> list[str]:
    """Validate input config and return list of errors."""
    errors = []
    required = ["length_m", "width_m", "soil_type", "climate_zone", "sun_exposure"]
    for key in required:
        if key not in config:
            errors.append(f"Champ requis manquant: {key}")

    valid_soil = {"clay", "sandy", "loamy", "silty", "peaty", "chalky"}
    if config.get("soil_type") not in valid_soil:
        errors.append(f"Type de sol invalide: {config.get('soil_type')}. Valides: {valid_soil}")

    valid_climate = {"tropical", "subtropical", "mediterranean", "temperate", "continental", "subarctic"}
    if config.get("climate_zone") not in valid_climate:
        errors.append(f"Zone climatique invalide: {config.get('climate_zone')}")

    valid_sun = {"full-sun", "partial-shade", "full-shade"}
    if config.get("sun_exposure") not in valid_sun:
        errors.append(f"Exposition invalide: {config.get('sun_exposure')}")

    if config.get("setup_type") not in ("new", "existing", None):
        errors.append(f"setup_type invalide: {config.get('setup_type')}. Utiliser 'new' ou 'existing'.")

    return errors


def run(config: dict) -> dict:
    """Run the full garden analysis pipeline."""
    # Defaults
    config.setdefault("setup_type", "new")
    config.setdefault("has_raised_beds", False)
    config.setdefault("has_greenhouse", False)
    config.setdefault("existing_plants", [])
    config.setdefault("latitude", None)
    config.setdefault("longitude", None)

    # Validate
    errors = validate_config(config)
    if errors:
        return {"error": True, "messages": errors}

    # Load plant database
    plants_db = load_plants()

    # Fetch weather
    weather_raw = None
    if config["latitude"] is not None and config["longitude"] is not None:
        weather_raw = fetch_weather(config["latitude"], config["longitude"])
    weather = parse_weather(weather_raw)

    now = datetime.now()

    # Determine all plant IDs involved
    existing_ids = [ep["plant_id"] for ep in config["existing_plants"]]

    # Companion analysis (for existing plants)
    companion_analysis = analyze_companions(existing_ids, plants_db)

    # Harvest schedule (for existing plants)
    harvest_schedule = compute_harvest_schedule(config["existing_plants"], plants_db, now)

    # Planting plan
    planting_plan = []
    improvements = []

    if config["setup_type"] == "new":
        planting_plan = generate_planting_plan(config, plants_db, weather)
        # Also run companion analysis on the generated plan
        plan_ids = [p["plant_id"] for p in planting_plan]
        companion_analysis = analyze_companions(plan_ids, plants_db)
    else:
        # Existing garden: suggest improvements
        improvements = suggest_improvements(
            config, plants_db, companion_analysis, harvest_schedule
        )

    # Generate alerts
    alerts = generate_alerts(config, plants_db, weather, harvest_schedule, companion_analysis)

    # Build output
    output = {
        "planting_plan": planting_plan,
        "improvements": improvements,
        "alerts": alerts,
        "weather_summary": {
            "current": weather["current"],
            "forecast_7d": weather["forecast_7d"],
            "watering_needed": weather["watering_needed"],
            "rainfall_last_7d_mm": weather["rainfall_last_7d_mm"],
        },
        "companion_analysis": companion_analysis,
        "harvest_schedule": harvest_schedule,
        "metadata": {
            "analyzed_at": now.isoformat(),
            "setup_type": config["setup_type"],
            "garden_area_m2": round(config["length_m"] * config["width_m"], 1),
            "plant_count": len(existing_ids) if config["setup_type"] == "existing" else sum(
                p["quantity"] for p in planting_plan
            ),
        },
    }

    return output


def main():
    parser = argparse.ArgumentParser(
        description="Smart Garden Analysis Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--config", "-c",
        type=str,
        help="Path to JSON config file. If omitted, reads from stdin.",
    )
    args = parser.parse_args()

    # Read config
    if args.config:
        if not os.path.exists(args.config):
            sys.stderr.write(f"Error: config file not found: {args.config}\n")
            sys.exit(1)
        with open(args.config, "r", encoding="utf-8") as f:
            config = json.load(f)
    else:
        # Read from stdin
        if sys.stdin.isatty():
            sys.stderr.write("Error: no config provided. Use --config or pipe JSON via stdin.\n")
            sys.exit(1)
        config = json.load(sys.stdin)

    result = run(config)
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
