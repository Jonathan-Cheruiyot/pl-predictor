"""
One-time cleanup: remove duplicate upcoming fixtures, keeping the earliest
(lowest id) for each (home_team_canonical, away_team_canonical) pair.

Canonical = run through aliases.resolve() so all name variants collapse.

Run from backend/: python dedup_fixtures.py
Safe to run multiple times — idempotent.
"""
from sqlalchemy import text
from database import engine
from aliases import resolve


def canonical(name: str) -> str:
    return resolve(name).strip().lower()


with engine.connect() as conn:
    rows = conn.execute(
        text("SELECT id, home_team, away_team, status FROM fixtures")
    ).fetchall()

    # Group by (canonical_home, canonical_away) — keep lowest id
    seen: dict[tuple, int] = {}
    to_delete: list[int] = []

    for fid, home, away, status in rows:
        key = (canonical(home), canonical(away))
        if key in seen:
            # Keep the lower id (earlier record); delete the higher
            existing_id = seen[key]
            if fid < existing_id:
                to_delete.append(existing_id)
                seen[key] = fid
            else:
                to_delete.append(fid)
        else:
            seen[key] = fid

    if not to_delete:
        print("No duplicates found — nothing to do.")
    else:
        print(f"Found {len(to_delete)} duplicate fixture(s) to remove: {to_delete}")
        # Delete dependent rows first (FK constraints)
        for fid in to_delete:
            conn.execute(text("DELETE FROM model_predictions WHERE fixture_id = :id"), {"id": fid})
            conn.execute(text("DELETE FROM user_predictions WHERE fixture_id = :id"), {"id": fid})
            conn.execute(text("DELETE FROM scores WHERE fixture_id = :id"), {"id": fid})
            conn.execute(text("DELETE FROM fixtures WHERE id = :id"), {"id": fid})
        conn.commit()
        print("Done. Duplicates removed.")
