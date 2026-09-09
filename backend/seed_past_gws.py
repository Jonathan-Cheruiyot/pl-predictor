"""
Seed past gameweeks (GW1–3) from football-data.org.

For each finished match it will:
  1. Create the fixture in the local DB (POST /fixtures)
  2. Ask for your predicted score — enter "1 0" style, or press Enter to skip
  3. Submit your prediction (POST /fixtures/{id}/user-prediction)
  4. Submit the actual result  (POST /fixtures/{id}/result)

Requires:
  - backend running at http://localhost:8000
  - DISABLE_KICKOFF_LOCK=true in backend/.env
  - FOOTBALL_DATA_KEY in backend/.env
Run from the backend/ directory:
  python seed_past_gws.py
"""

import os
import sys
import time

import httpx
from dotenv import load_dotenv
from aliases import resolve

load_dotenv()

FDORG_KEY  = os.getenv("FOOTBALL_DATA_KEY", "")
FDORG_BASE = "https://api.football-data.org/v4"
APP_BASE   = "http://localhost:8000"
USERNAME   = "jonathan"
GAMEWEEKS  = [1, 2, 3]


# ---------------------------------------------------------------------------
# football-data.org helpers
# ---------------------------------------------------------------------------

def fetch_gw(matchday: int) -> list[dict]:
    """Return finished PL matches for a given matchday."""
    r = httpx.get(
        f"{FDORG_BASE}/competitions/PL/matches",
        params={"matchday": matchday, "status": "FINISHED"},
        headers={"X-Auth-Token": FDORG_KEY},
        timeout=15,
    )
    r.raise_for_status()
    return r.json().get("matches", [])


def parse_match(m: dict) -> dict | None:
    """Extract fields we need; return None if score is missing."""
    score = m.get("score", {})
    ft    = score.get("fullTime", {})
    home_goals = ft.get("home")
    away_goals = ft.get("away")
    if home_goals is None or away_goals is None:
        return None

    home_short = (m.get("homeTeam") or {}).get("shortName")
    away_short = (m.get("awayTeam") or {}).get("shortName")
    if not home_short or not away_short:
        return None

    return {
        "home_team":    resolve(home_short),
        "away_team":    resolve(away_short),
        "kickoff_time": m["utcDate"],
        "gameweek":     m.get("matchday"),
        "actual_home":  home_goals,
        "actual_away":  away_goals,
    }


# ---------------------------------------------------------------------------
# App API helpers
# ---------------------------------------------------------------------------

def create_fixture(match: dict) -> int | None:
    """POST /fixtures. Returns fixture id, or None if the team isn't known."""
    payload = {
        "home_team":    match["home_team"],
        "away_team":    match["away_team"],
        "kickoff_time": match["kickoff_time"],
        "gameweek":     match["gameweek"],
    }
    r = httpx.post(f"{APP_BASE}/fixtures", json=payload, timeout=15)
    if r.status_code == 201:
        return r.json()["id"]
    print(f"    ✗  Could not create fixture: {r.status_code} {r.text}")
    return None


def fixture_exists(match: dict) -> int | None:
    """Check whether this home+away pair is already in the DB."""
    r = httpx.get(f"{APP_BASE}/fixtures", timeout=10)
    if not r.is_success:
        return None
    for f in r.json():
        if (f["home_team"] == match["home_team"]
                and f["away_team"] == match["away_team"]):
            return f["id"]
    return None


def submit_prediction(fixture_id: int, pred_home: int, pred_away: int) -> bool:
    payload = {
        "username":       USERNAME,
        "predicted_home": pred_home,
        "predicted_away": pred_away,
    }
    r = httpx.post(
        f"{APP_BASE}/fixtures/{fixture_id}/user-prediction",
        json=payload,
        timeout=10,
    )
    return r.is_success


def submit_result(fixture_id: int, actual_home: int, actual_away: int) -> bool:
    r = httpx.post(
        f"{APP_BASE}/fixtures/{fixture_id}/result",
        json={"actual_home": actual_home, "actual_away": actual_away},
        timeout=10,
    )
    return r.is_success


# ---------------------------------------------------------------------------
# Interactive prompt
# ---------------------------------------------------------------------------

def ask_prediction(home: str, away: str, actual_h: int, actual_a: int) -> tuple[int, int] | None:
    """
    Ask the user for their predicted score.
    Returns (home_goals, away_goals) or None to skip this match.
    """
    while True:
        raw = input(
            f"    Your prediction for {home} vs {away} "
            f"[actual: {actual_h}–{actual_a}]  (e.g. 2 1, or Enter to skip): "
        ).strip()

        if raw == "":
            return None

        parts = raw.replace("-", " ").replace(":", " ").split()
        if len(parts) == 2 and all(p.isdigit() for p in parts):
            return int(parts[0]), int(parts[1])

        print("    Enter two numbers separated by a space, e.g. '2 1'")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not FDORG_KEY:
        sys.exit("FOOTBALL_DATA_KEY not set in .env — aborting.")

    print("Checking backend is reachable…")
    try:
        httpx.get(f"{APP_BASE}/fixtures", timeout=5).raise_for_status()
    except Exception as e:
        sys.exit(f"Backend not reachable at {APP_BASE}: {e}")

    total_created = total_predicted = total_scored = 0

    for gw in GAMEWEEKS:
        print(f"\n{'='*55}")
        print(f"  Gameweek {gw}")
        print(f"{'='*55}")

        try:
            raw_matches = fetch_gw(gw)
        except Exception as e:
            print(f"  Could not fetch GW{gw} from football-data.org: {e}")
            continue

        matches = [parse_match(m) for m in raw_matches]
        matches = [m for m in matches if m]

        if not matches:
            print("  No finished matches found for this gameweek.")
            continue

        for match in matches:
            h, a = match["home_team"], match["away_team"]
            ah, aa = match["actual_home"], match["actual_away"]
            print(f"\n  {h} vs {a}  (result: {ah}–{aa})")

            # 1. Create or find fixture
            fid = fixture_exists(match)
            if fid:
                print(f"    → Fixture already in DB (id={fid})")
            else:
                fid = create_fixture(match)
                if fid is None:
                    continue
                print(f"    → Fixture created (id={fid})")
                total_created += 1
                time.sleep(0.1)  # avoid hammering local DB

            # 2. Ask for prediction
            pred = ask_prediction(h, a, ah, aa)
            if pred is None:
                print("    Skipped.")
                continue
            ph, pa = pred

            if submit_prediction(fid, ph, pa):
                print(f"    ✓  Prediction submitted: {ph}–{pa}")
                total_predicted += 1
            else:
                print("    ✗  Prediction submission failed (lock still on?)")
                continue

            # 3. Submit actual result & score
            if submit_result(fid, ah, aa):
                print(f"    ✓  Result recorded: {ah}–{aa} — scoring applied")
                total_scored += 1
            else:
                print("    ✗  Result submission failed")

    print(f"\n{'='*55}")
    print(f"  Done.  Fixtures created: {total_created}  |  "
          f"Predictions: {total_predicted}  |  Results scored: {total_scored}")
    print(f"{'='*55}")
    print("\nRemember to set DISABLE_KICKOFF_LOCK=false in .env and restart the backend.")


if __name__ == "__main__":
    main()
