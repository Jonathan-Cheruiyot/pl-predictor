"""
Seed the SQLite DB with sample upcoming fixtures for local development.

Usage (from backend/):
    python seed.py

Fixtures are set to future dates so the prediction window stays open.
Run the server first so the DB is created, or just run this after uvicorn
has created pl_predictor.db.
"""
import sys
from datetime import datetime, timezone, timedelta

# ensure imports resolve from backend/
sys.path.insert(0, ".")

from database import SessionLocal, engine
import orm

orm.Base.metadata.create_all(bind=engine)

# Sample GW1 fixtures for 2026/27 — adjust dates/teams as needed
FIXTURES = [
    ("Arsenal", "Man City", 1),
    ("Liverpool", "Chelsea", 1),
    ("Man United", "Tottenham", 1),
    ("Newcastle", "Aston Villa", 1),
    ("Brighton", "Wolves", 1),
    ("Everton", "Brentford", 1),
]

def future_kickoff(days_from_now: int, hour: int = 15) -> datetime:
    """Returns a naive UTC datetime N days from now at HH:00."""
    base = datetime.now(timezone.utc).replace(tzinfo=None)
    return (base + timedelta(days=days_from_now)).replace(hour=hour, minute=0, second=0, microsecond=0)

def seed():
    db = SessionLocal()
    try:
        if db.query(orm.Fixture).count() > 0:
            print("DB already has fixtures — skipping seed. Delete pl_predictor.db to reseed.")
            return

        # Import predictor here so we can auto-generate model predictions
        from predictor import PLPredictor
        print("Training model for seeding…")
        predictor = PLPredictor()

        for i, (home, away, gw) in enumerate(FIXTURES):
            kickoff = future_kickoff(days_from_now=7 + i)
            fixture = orm.Fixture(
                home_team=home,
                away_team=away,
                kickoff_time=kickoff,
                gameweek=gw,
            )
            db.add(fixture)
            db.flush()

            try:
                pred = predictor.predict(home, away)
            except KeyError as e:
                print(f"  WARNING: unknown team {e}, skipping model prediction for {home} vs {away}")
                db.commit()
                continue

            model_pred = orm.ModelPrediction(fixture_id=fixture.id, **pred)
            db.add(model_pred)
            db.commit()
            print(f"  Seeded: {home} vs {away} (GW{gw}) — model predicts {pred['predicted_home']}-{pred['predicted_away']}")

        print(f"\nDone. {len(FIXTURES)} fixtures seeded.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
