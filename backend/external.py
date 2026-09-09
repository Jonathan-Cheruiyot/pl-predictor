"""
Cached HTTP calls to external football data APIs.

football-data.org  — standings (free tier: 10 req/min)
TheSportsDB        — squad/roster (free tier, no key required)
"""
import os
import time
import httpx

FDORG_KEY = os.getenv("FOOTBALL_DATA_KEY", "")
FDORG_BASE = "https://api.football-data.org/v4"
TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3"

STANDINGS_TTL = 300    # 5 minutes — table doesn't change mid-minute
SCHEDULED_TTL = 1200   # 20 minutes — kickoff times matter but don't change every minute
SQUAD_TTL = 3600       # 1 hour — squads are stable

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
# Squad via TheSportsDB
# ---------------------------------------------------------------------------

def _get_tsdb_team_id(team_short: str) -> str | None:
    """Search TheSportsDB by short name, return their team ID."""
    def fetch():
        r = httpx.get(
            f"{TSDB_BASE}/searchteams.php",
            params={"t": team_short},
            timeout=10,
        )
        r.raise_for_status()
        teams = r.json().get("teams") or []
        # Pick the first result in the English Premier League
        for t in teams:
            if "Premier League" in (t.get("strLeague") or ""):
                return t["idTeam"]
        # Fallback: just take the first result
        return teams[0]["idTeam"] if teams else None

    return _get_cached(f"tsdb_id:{team_short}", SQUAD_TTL, fetch)


def get_squad(team_short: str) -> list[dict]:
    """
    Returns a list of players (name, number, position, nationality) for a team.
    Fetches team ID from TheSportsDB by short name, then fetches the squad.
    Results cached for SQUAD_TTL seconds.
    """
    def fetch():
        team_id = _get_tsdb_team_id(team_short)
        if not team_id:
            return []

        r = httpx.get(
            f"{TSDB_BASE}/lookup_all_players.php",
            params={"id": team_id},
            timeout=10,
        )
        r.raise_for_status()
        players = r.json().get("player") or []

        result = []
        for p in players:
            number = (p.get("strNumber") or "").strip()
            position = (p.get("strPosition") or "").strip()
            # Skip coaching/non-playing staff
            if position.lower() in {"manager", "assistant coach", "coaching", "coach"}:
                continue
            result.append({
                "name": p.get("strPlayer", ""),
                "number": number,
                "position": position,
                "nationality": p.get("strNationality", ""),
            })

        # Sort: numbered players first (by number), then unnumbered
        def sort_key(p):
            n = p["number"]
            return (0, int(n)) if n.isdigit() else (1, p["name"])

        result.sort(key=sort_key)
        return result

    return _get_cached(f"squad:{team_short}", SQUAD_TTL, fetch)
