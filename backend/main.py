"""
PL Predictor API
================
Run with: uvicorn main:app --reload
Docs at:  http://localhost:8000/docs
"""
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

import external
import orm
import schemas
from database import Base, engine, get_db
from predictor import PLPredictor

# ---------------------------------------------------------------------------
# Startup: train model once, keep in memory
# ---------------------------------------------------------------------------

_predictor: PLPredictor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _predictor
    print("Training LightGBM model on historical data…")
    _predictor = PLPredictor()
    print(f"Model ready. {len(_predictor.teams)} teams loaded.")
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="PL Predictor API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utcnow() -> datetime:
    """Naive UTC datetime — matches what SQLite/SQLAlchemy stores."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _score_prediction(pred_h: int, pred_a: int, actual_h: int, actual_a: int) -> int:
    """3/2/0 scoring rule. Exact match = 3, correct outcome = 2, wrong = 0."""
    if pred_h == actual_h and pred_a == actual_a:
        return 3
    pred_outcome = "H" if pred_h > pred_a else ("A" if pred_a > pred_h else "D")
    actual_outcome = "H" if actual_h > actual_a else ("A" if actual_a > actual_h else "D")
    return 2 if pred_outcome == actual_outcome else 0


def _get_fixture_or_404(fixture_id: int, db: Session) -> orm.Fixture:
    fixture = db.get(orm.Fixture, fixture_id)
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return fixture


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _sync_scheduled_fixtures(db: Session) -> None:
    """
    Pull upcoming PL matches from football-data.org and upsert them into the
    local DB so the prediction flow (which needs DB fixture IDs) keeps working.
    Silently skips any match that can't be synced (e.g. unknown team name).
    """
    try:
        matches = external.get_scheduled_matches()
    except Exception:
        return  # External API unavailable — don't break the fixtures endpoint

    changed = False
    for m in matches:
        # Dedup: one home fixture per team pair per season
        existing = (
            db.query(orm.Fixture)
            .filter_by(home_team=m["home_team"], away_team=m["away_team"])
            .first()
        )

        kickoff_str = m["kickoff_time"]
        kickoff = datetime.fromisoformat(kickoff_str.replace("Z", "+00:00"))
        kickoff = kickoff.astimezone(timezone.utc).replace(tzinfo=None)

        if existing:
            # Update time/matchday if changed (e.g. rescheduled)
            if existing.kickoff_time != kickoff or existing.gameweek != m["gameweek"]:
                existing.kickoff_time = kickoff
                existing.gameweek = m["gameweek"]
                changed = True
            continue

        # New fixture — create and try to generate model prediction
        fixture = orm.Fixture(
            home_team=m["home_team"],
            away_team=m["away_team"],
            kickoff_time=kickoff,
            gameweek=m["gameweek"],
        )
        db.add(fixture)
        db.flush()

        try:
            if _predictor:
                pred = _predictor.predict(m["home_team"], m["away_team"])
                db.add(orm.ModelPrediction(fixture_id=fixture.id, **pred))
        except Exception:
            pass  # Unknown team or predictor error — fixture exists without model pred

        changed = True

    if changed:
        db.commit()


@app.get("/fixtures", response_model=list[schemas.FixtureOut])
def list_fixtures(
    status: Optional[str] = None,
    gameweek: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    List fixtures. Upcoming fixtures are synced from football-data.org on each
    call (cached externally for 20 min). Filter by ?status=upcoming|completed
    and/or ?gameweek=N.
    """
    if status != "completed":
        _sync_scheduled_fixtures(db)

    q = db.query(orm.Fixture)
    if status:
        q = q.filter(orm.Fixture.status == status)
    if gameweek is not None:
        q = q.filter(orm.Fixture.gameweek == gameweek)
    return q.order_by(orm.Fixture.kickoff_time).all()


@app.post("/fixtures", response_model=schemas.FixtureOut, status_code=status.HTTP_201_CREATED)
def create_fixture(payload: schemas.FixtureCreate, db: Session = Depends(get_db)):
    """
    Create a fixture and auto-generate the model's prediction (stored, not yet revealed).
    Kickoff time should be provided in UTC.
    """
    # Normalise to naive UTC before storing
    kickoff = payload.kickoff_time
    if kickoff.tzinfo is not None:
        kickoff = kickoff.astimezone(timezone.utc).replace(tzinfo=None)

    fixture = orm.Fixture(
        home_team=payload.home_team,
        away_team=payload.away_team,
        kickoff_time=kickoff,
        gameweek=payload.gameweek,
    )
    db.add(fixture)
    db.flush()  # populate fixture.id before creating the FK row

    try:
        pred = _predictor.predict(payload.home_team, payload.away_team)
    except KeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Unknown team: {e}")

    model_pred = orm.ModelPrediction(fixture_id=fixture.id, **pred)
    db.add(model_pred)
    db.commit()
    db.refresh(fixture)
    return fixture


@app.get("/fixtures/{fixture_id}", response_model=schemas.FixtureOut)
def get_fixture(fixture_id: int, db: Session = Depends(get_db)):
    return _get_fixture_or_404(fixture_id, db)


# ---------------------------------------------------------------------------
# Model prediction (revealed only after user has submitted)
# ---------------------------------------------------------------------------

@app.get("/fixtures/{fixture_id}/model-prediction", response_model=schemas.ModelPredictionOut)
def get_model_prediction(fixture_id: int, username: str, db: Session = Depends(get_db)):
    """
    Returns the model's prediction for a fixture.
    Requires the user to have already submitted their own prediction (fairness gate).
    Pass ?username=<username> to identify the user.
    """
    _get_fixture_or_404(fixture_id, db)

    has_predicted = (
        db.query(orm.UserPrediction)
        .filter_by(fixture_id=fixture_id, username=username)
        .first()
    )
    if not has_predicted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Submit your prediction first to see the model's prediction.",
        )

    model_pred = db.query(orm.ModelPrediction).filter_by(fixture_id=fixture_id).first()
    if not model_pred:
        raise HTTPException(status_code=404, detail="Model prediction not available.")
    return model_pred


# ---------------------------------------------------------------------------
# User predictions
# ---------------------------------------------------------------------------

@app.post(
    "/fixtures/{fixture_id}/user-prediction",
    response_model=schemas.UserPredictionOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_user_prediction(
    fixture_id: int,
    payload: schemas.UserPredictionCreate,
    db: Session = Depends(get_db),
):
    """
    Submit (or update) a user's scoreline prediction.
    Blocked once the fixture is completed or has kicked off.
    """
    fixture = _get_fixture_or_404(fixture_id, db)

    if fixture.status == "completed":
        raise HTTPException(status_code=400, detail="Match already completed.")

    now = _utcnow()
    if now >= fixture.kickoff_time:
        raise HTTPException(status_code=400, detail="Prediction window closed — match has kicked off.")

    existing = (
        db.query(orm.UserPrediction)
        .filter_by(fixture_id=fixture_id, username=payload.username)
        .first()
    )
    if existing:
        existing.predicted_home = payload.predicted_home
        existing.predicted_away = payload.predicted_away
        existing.submitted_at = now
        db.commit()
        db.refresh(existing)
        return existing

    user_pred = orm.UserPrediction(
        fixture_id=fixture_id,
        username=payload.username,
        predicted_home=payload.predicted_home,
        predicted_away=payload.predicted_away,
        submitted_at=now,
    )
    db.add(user_pred)
    db.commit()
    db.refresh(user_pred)
    return user_pred


@app.get(
    "/fixtures/{fixture_id}/user-prediction/{username}",
    response_model=schemas.UserPredictionOut,
)
def get_user_prediction(fixture_id: int, username: str, db: Session = Depends(get_db)):
    _get_fixture_or_404(fixture_id, db)
    pred = (
        db.query(orm.UserPrediction)
        .filter_by(fixture_id=fixture_id, username=username)
        .first()
    )
    if not pred:
        raise HTTPException(status_code=404, detail="No prediction found for this user and fixture.")
    return pred


# ---------------------------------------------------------------------------
# Results + scoring
# ---------------------------------------------------------------------------

@app.post("/fixtures/{fixture_id}/result", response_model=list[schemas.ScoreOut])
def submit_result(
    fixture_id: int,
    payload: schemas.ResultSubmit,
    db: Session = Depends(get_db),
):
    """
    Record the actual result for a fixture. Automatically scores all user
    predictions and the model prediction using the 3/2/0 rule.
    Returns one ScoreOut per user who predicted.
    """
    fixture = _get_fixture_or_404(fixture_id, db)

    fixture.actual_home = payload.actual_home
    fixture.actual_away = payload.actual_away
    fixture.status = "completed"

    model_pred = db.query(orm.ModelPrediction).filter_by(fixture_id=fixture_id).first()
    model_pts = (
        _score_prediction(
            model_pred.predicted_home, model_pred.predicted_away,
            payload.actual_home, payload.actual_away,
        )
        if model_pred else 0
    )

    user_preds = db.query(orm.UserPrediction).filter_by(fixture_id=fixture_id).all()
    scores = []
    for up in user_preds:
        user_pts = _score_prediction(
            up.predicted_home, up.predicted_away,
            payload.actual_home, payload.actual_away,
        )
        existing = (
            db.query(orm.Score)
            .filter_by(fixture_id=fixture_id, username=up.username)
            .first()
        )
        if existing:
            existing.user_score = user_pts
            existing.model_score = model_pts
            scores.append(existing)
        else:
            sc = orm.Score(
                fixture_id=fixture_id,
                username=up.username,
                user_score=user_pts,
                model_score=model_pts,
            )
            db.add(sc)
            scores.append(sc)

    db.commit()
    return scores


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

@app.get("/leaderboard/history/{username}")
def leaderboard_history(username: str, db: Session = Depends(get_db)):
    """
    Per-fixture scores for a user, ordered by kickoff time.
    Returns list of {fixture_id, kickoff_time, home_team, away_team, user_score, model_score}.
    Used to draw a cumulative points chart on the leaderboard page.
    """
    rows = (
        db.query(orm.Score, orm.Fixture)
        .join(orm.Fixture, orm.Score.fixture_id == orm.Fixture.id)
        .filter(orm.Score.username == username)
        .order_by(orm.Fixture.kickoff_time)
        .all()
    )
    return [
        {
            "fixture_id": score.fixture_id,
            "kickoff_time": fixture.kickoff_time.isoformat(),
            "home_team": fixture.home_team,
            "away_team": fixture.away_team,
            "user_score": score.user_score,
            "model_score": score.model_score,
        }
        for score, fixture in rows
    ]


@app.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db)):
    """Running totals: each user's accumulated points vs the model."""
    rows = (
        db.query(
            orm.Score.username,
            func.sum(orm.Score.user_score).label("total_user_score"),
            func.sum(orm.Score.model_score).label("total_model_score"),
            func.count(orm.Score.id).label("matches_played"),
        )
        .group_by(orm.Score.username)
        .order_by(func.sum(orm.Score.user_score).desc())
        .all()
    )
    return [
        schemas.LeaderboardEntry(
            username=r.username,
            total_user_score=r.total_user_score,
            total_model_score=r.total_model_score,
            matches_played=r.matches_played,
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Teams (useful for frontend dropdowns)
# ---------------------------------------------------------------------------

@app.get("/teams", response_model=list[str])
def list_teams():
    """All team names the model knows about (from training data)."""
    return sorted(_predictor.teams)


# ---------------------------------------------------------------------------
# League table
# ---------------------------------------------------------------------------

@app.get("/league/crests")
def league_crests():
    """
    Returns {shortName: crestUrl} for all current PL teams.
    Useful for looking up crests by team name without loading the full standings.
    Cached server-side for 5 minutes.
    """
    try:
        standings = external.get_standings()
        return {row["team_short"]: row["crest_url"] for row in standings}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch crests: {e}")


@app.get("/league/standings")
def league_standings():
    """
    Current Premier League standings from football-data.org.
    Cached for 5 minutes server-side.
    """
    try:
        return external.get_standings()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch standings: {e}")


@app.get("/league/team/{team_short}/squad")
def team_squad(team_short: str):
    """
    Squad (name + number + position + nationality) for a team from TheSportsDB.
    team_short is the short name as returned in the standings response (e.g. 'Arsenal').
    Cached for 1 hour server-side.
    """
    try:
        return external.get_squad(team_short)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch squad: {e}")
