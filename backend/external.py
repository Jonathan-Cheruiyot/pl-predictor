"""
Cached HTTP calls to external football data APIs.

football-data.org  — standings + scheduled fixtures (free tier: 10 req/min)
API-Football       — squad/roster (free tier: 100 req/day; key required)
"""
import logging
import os
import time
import httpx

logger = logging.getLogger(__name__)

FDORG_KEY   = os.getenv("FOOTBALL_DATA_KEY", "")
FDORG_BASE  = "https://api.football-data.org/v4"

APIF_KEY    = os.getenv("API_FOOTBALL_KEY", "")
APIF_BASE   = "https://v3.football.api-sports.io"

STANDINGS_TTL = 300      # 5 minutes
SCHEDULED_TTL = 1200     # 20 minutes
SQUAD_TTL     = 86400    # 24 hours — rosters rarely change day-to-day

# ---------------------------------------------------------------------------
# API-Football team ID map — keyed by fd.org shortName (what we store/use)
# Keys are the EXACT shortName values fd.org returns; alternates listed below
# ---------------------------------------------------------------------------
_APIF_TEAM_IDS: dict[str, int] = {
    # ── Current 2025/26 PL — exact fd.org shortNames ──────────────────────
    "Arsenal":        42,
    "Aston Villa":    66,
    "Bournemouth":    35,
    "Brentford":      55,
    "Brighton Hove":  51,   # fd.org returns "Brighton Hove"
    "Chelsea":        49,
    "Coventry City":  1346,
    "Crystal Palace": 52,
    "Everton":        45,
    "Fulham":         36,
    "Hull City":      64,
    "Ipswich Town":   57,
    "Leeds United":   63,
    "Liverpool":      40,
    "Man City":       50,
    "Man United":     33,   # fd.org returns "Man United"
    "Newcastle":      34,   # fd.org returns "Newcastle"
    "Nottingham":     65,   # fd.org returns "Nottingham"
    "Southampton":    41,
    "Sunderland":     746,
    "Tottenham":      47,
    "Wolves":         39,
    # ── Alternates / previous seasons / manual fixture creation ───────────
    "Brighton":               51,
    "Brighton & Hove Albion": 51,
    "Coventry":               1346,
    "Hull":                   64,
    "Ipswich":                57,
    "Leeds":                  63,
    "Leicester":              46,
    "Leicester City":         46,
    "Man Utd":                33,
    "Manchester City":        50,
    "Manchester United":      33,
    "Newcastle United":       34,
    "Newcastle Utd":          34,
    "Nottingham Forest":      65,
    "Nottm Forest":           65,
    "Nott'm Forest":          65,
    "Spurs":                  47,
    "West Ham":               48,
    "Wolverhampton":          39,
}

# key → (fetched_at, data)
_cache: dict[str, tuple[float, object]] = {}


def _get_cached(key: str, ttl: float, fetch):
    now = time.time()
    if key in _cache:
        fetched_at, data = _cache[key]
        if now - fetched_at < ttl:
            return data
    data = fetch()
    _cache[key] = (now, data)
    return data


# ---------------------------------------------------------------------------
# Standings
# ---------------------------------------------------------------------------

def get_standings() -> list[dict]:
    """
    Fetches PL standings from football-data.org and returns a clean list.
    Result is cached for STANDINGS_TTL seconds.
    """
    def fetch():
        r = httpx.get(
            f"{FDORG_BASE}/competitions/PL/standings",
            headers={"X-Auth-Token": FDORG_KEY},
            timeout=10,
        )
        r.raise_for_status()
        payload = r.json()

        # standings[0] is type=TOTAL, which is what we want
        table = next(
            s["table"] for s in payload["standings"] if s["type"] == "TOTAL"
        )

        return [
            {
                "position": row["position"],
                "team_id": row["team"]["id"],
                "team_name": row["team"]["name"],
                "team_short": row["team"]["shortName"],
                "crest_url": row["team"]["crest"],
                "played": row["playedGames"],
                "won": row["won"],
                "drawn": row["draw"],
                "lost": row["lost"],
                "goals_for": row["goalsFor"],
                "goals_against": row["goalsAgainst"],
                "goal_difference": row["goalDifference"],
                "points": row["points"],
            }
            for row in table
        ]

    return _get_cached("standings", STANDINGS_TTL, fetch)


# ---------------------------------------------------------------------------
# Scheduled PL matches
# ---------------------------------------------------------------------------

def get_scheduled_matches() -> list[dict]:
    """
    Fetches upcoming (SCHEDULED) PL matches from football-data.org.
    Returns a normalised list of dicts compatible with the Fixture ORM shape.
    Cached for SCHEDULED_TTL seconds.
    """
    def fetch():
        r = httpx.get(
            f"{FDORG_BASE}/competitions/PL/matches",
            params={"status": "SCHEDULED"},
            headers={"X-Auth-Token": FDORG_KEY},
            timeout=10,
        )
        r.raise_for_status()
        matches = r.json().get("matches", [])
        result = []
        for m in matches:
            home_short = (m.get("homeTeam") or {}).get("shortName")
            away_short = (m.get("awayTeam") or {}).get("shortName")
            if not home_short or not away_short:
                continue
            result.append({
                "home_team": home_short,
                "away_team": away_short,
                "kickoff_time": m["utcDate"],   # ISO 8601 with Z
                "gameweek": m.get("matchday"),
            })
        return result

    return _get_cached("scheduled_matches", SCHEDULED_TTL, fetch)


# ---------------------------------------------------------------------------
# Squad via API-Football
# ---------------------------------------------------------------------------

# API-Football position labels → normalised display labels
_APIF_POSITION_MAP = {
    "Goalkeeper": "Goalkeeper",
    "Defender":   "Defender",
    "Midfielder":  "Midfielder",
    "Attacker":   "Forward",
}


def get_squad(team_short: str) -> list[dict]:
    """
    Returns a list of players (name, number, position, nationality) for a team.
    Uses API-Football free tier (/players/squads?team={id}).
    Results cached for SQUAD_TTL seconds (24 h).
    """
    def fetch():
        team_id = _APIF_TEAM_IDS.get(team_short)
        if not team_id:
            logger.warning(
                "get_squad: no API-Football ID for team %r — add it to _APIF_TEAM_IDS",
                team_short,
            )
            return []

        r = httpx.get(
            f"{APIF_BASE}/players/squads",
            params={"team": team_id},
            headers={"x-apisports-key": APIF_KEY},
            timeout=15,
        )
        r.raise_for_status()

        data = r.json()
        responses = data.get("response") or []
        if not responses:
            logger.warning(
                "get_squad: API-Football returned empty response for team %r (id=%s)",
                team_short, team_id,
            )
            return []

        players_raw = responses[0].get("players") or []
        result = []
        for p in players_raw:
            number = str(p.get("number") or "").strip()
            position = _APIF_POSITION_MAP.get(p.get("position", ""), p.get("position", ""))
            result.append({
                "name":        p.get("name", ""),
                "number":      number,
                "position":    position,
                "nationality": "",   # not returned by /squads endpoint
            })

        # Sort: numbered players first (by number), then unnumbered
        def sort_key(p):
            n = p["number"]
            return (0, int(n)) if n.isdigit() else (1, p["name"])

        result.sort(key=sort_key)
        return result

    return _get_cached(f"squad:{team_short}", SQUAD_TTL, fetch)
