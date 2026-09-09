"""
Diagnostic: cross-reference fd.org shortNames with API-Football team IDs.
Run from backend/: python audit_team_ids.py

Prints:
  - All shortNames fd.org returns in the current PL standings
  - All teams API-Football has for the current PL season (league 39)
  - Which fd.org names resolve to an ID in our map, which don't
"""
import os
import sys
import httpx
from dotenv import load_dotenv

load_dotenv()

FDORG_KEY = os.getenv("FOOTBALL_DATA_KEY", "")
APIF_KEY  = os.getenv("API_FOOTBALL_KEY", "")

if not FDORG_KEY or not APIF_KEY:
    sys.exit("Missing FOOTBALL_DATA_KEY or API_FOOTBALL_KEY in .env")

# ---------------------------------------------------------------------------
# 1. fd.org shortNames from live standings
# ---------------------------------------------------------------------------
print("\n── football-data.org: current PL standings shortNames ──")
try:
    r = httpx.get(
        "https://api.football-data.org/v4/competitions/PL/standings",
        headers={"X-Auth-Token": FDORG_KEY},
        timeout=10,
    )
    r.raise_for_status()
    table = next(
        s["table"] for s in r.json()["standings"] if s["type"] == "TOTAL"
    )
    fd_names = []
    for row in table:
        short = row["team"]["shortName"]
        full  = row["team"]["name"]
        fd_names.append(short)
        print(f"  {row['position']:>2}. {short!r:<22}  (full: {full})")
except Exception as e:
    print(f"  ERROR: {e}")
    fd_names = []

# ---------------------------------------------------------------------------
# 2. API-Football: all PL teams for latest season
# ---------------------------------------------------------------------------
print("\n── API-Football: PL teams (league=39, season=2024) ──")
apif_teams = {}
try:
    r = httpx.get(
        "https://v3.football.api-sports.io/teams",
        params={"league": 39, "season": 2024},
        headers={"x-apisports-key": APIF_KEY},
        timeout=15,
    )
    r.raise_for_status()
    for entry in r.json().get("response", []):
        t = entry["team"]
        apif_teams[t["id"]] = t["name"]
        print(f"  id={t['id']:<6} {t['name']!r}")
except Exception as e:
    print(f"  ERROR: {e}")

# ---------------------------------------------------------------------------
# 3. Cross-reference: which fd.org names hit our current map?
# ---------------------------------------------------------------------------
# Import the current map
try:
    import sys; sys.path.insert(0, ".")
    from external import _APIF_TEAM_IDS
    print("\n── Cross-reference: fd.org name → mapped ID ──")
    missing = []
    for name in fd_names:
        tid = _APIF_TEAM_IDS.get(name)
        api_name = apif_teams.get(tid, "?") if tid else "—"
        status = "✓" if tid else "✗ MISSING"
        print(f"  {status}  {name!r:<22} → id={tid}  ({api_name})")
        if not tid:
            missing.append(name)

    if missing:
        print(f"\n  {len(missing)} name(s) with no ID mapping: {missing}")
    else:
        print("\n  All fd.org names resolved successfully.")
except Exception as e:
    print(f"\n  Could not import _APIF_TEAM_IDS: {e}")
