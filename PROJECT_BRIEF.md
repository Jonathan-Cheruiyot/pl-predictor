# Project Brief: PL Predictor (for Claude Code handoff)

Paste this into your first message to Claude Code so it has full context without you re-explaining everything.

## What this is

A Premier League match predictor app where a user competes against an ML model's weekly predictions. Both the model and the user predict a scoreline before kickoff; both get scored against the actual result using a partial-credit system. Tracks accuracy over a season via a leaderboard.

This started as a portfolio project — the goal is a real, deployed full-stack app that demonstrates genuine ML modeling depth (not just an LLM API wrapper) plus full-stack engineering, for internship/new-grad SWE recruiting.

## Scoring rule (exact, don't change without asking)

- Exact scoreline match: **3 points**
- Correct winner/draw, wrong scoreline: **2 points**
- Wrong outcome entirely: **0 points**

This applies identically to the model's prediction and the user's prediction each gameweek.

## What's already built (in the `pl-predictor` repo, pushed to GitHub)

- `data/` — 5 seasons of real Premier League match data (2020/21–2024/25, ~1,900 matches), CSV format, columns include Date, HomeTeam, AwayTeam, FTHG, FTAG (full-time goals) plus shots/corners/cards. Sourced from football-data.co.uk via datahub.io, ODC-PDDL licensed.
- `model.py` — Dixon-Coles model. Estimates each team's attack/defense strength via MLE (scipy.optimize, vectorized with numpy), predicts full scorelines via bivariate Poisson with the Dixon-Coles low-score correction (adjusts P(0-0), P(1-0), P(0-1), P(1-1)).
- `features.py` — Leakage-free rolling-form feature engineering for the gradient-boosted model. For each match, computes each team's trailing stats (last 6 games: avg goals for/against, points per game, home/away-specific splits) using only matches strictly before that date.
- `compare_models.py` — Trains both Dixon-Coles and a LightGBM model (multiclass classifier for outcome H/D/A + two Poisson-objective regressors for home/away goals) on the same training split, backtests both on the same 91 held-out matches (April–May 2025), scores both with the app's exact scoring rule.
- `backtest.py` — Standalone Dixon-Coles backtest (superseded by compare_models.py but kept for reference).
- `README.md` — Project overview, backtest results table, roadmap, setup instructions.

## Backtest results (real, already validated — don't re-derive from scratch)

Trained on data through ~March 2025, tested on 91 matches from April–May 2025:

| Model | Avg points/match | Correct result | Exact score | Log loss |
|---|---|---|---|---|
| Dixon-Coles | 0.78 | 35.2% | 7.7% | **0.980** (better calibrated) |
| LightGBM | **1.23** | **53.8%** | **15.4%** | 1.017 |

Naive baseline (always predict 1-1): 0.57 avg points/match.

**Decision made:** LightGBM's scoreline predictions are what the live app uses to compete against the user, since it wins on the scoring-rule metrics. Dixon-Coles' better log-loss is a documented finding (better probability calibration despite worse point predictions) — kept as evidence of real model evaluation, not thrown away.

## Tech stack (decided, don't relitigate)

- Backend: Python, FastAPI (not yet built)
- Database: PostgreSQL via Supabase (Jonathan already has Supabase experience from a prior project, MealShare)
- Frontend: React + TypeScript (not yet built)
- Modeling: Python — pandas, numpy, scipy, LightGBM, scikit-learn (built, see above)
- Deployment target: not yet decided (Render or similar likely, TBD)

## What's next — this is where Claude Code should pick up

1. **FastAPI backend** — endpoints needed:
   - Fixtures (upcoming matches to predict on)
   - Model predictions (serve LightGBM's prediction for a given fixture)
   - User predictions (submit + retrieve a user's scoreline guess per fixture)
   - Scoring (apply the 3/2/0 rule once real results come in)
   - Leaderboard (running totals: user vs. model over a season)
   - Suggested approach: start with SQLite or in-memory storage to get the API shape right, then migrate to Postgres/Supabase once the endpoints are solid.
2. **Database schema** (Postgres/Supabase) — tables likely needed: `matches`, `model_predictions`, `user_predictions`, `scores`. Not yet designed in detail — this is open for Claude Code to help design.
3. **Frontend** — React/TS app: submit a prediction before kickoff, see the model's prediction revealed after submission (to keep it fair), running leaderboard.
4. **Automated weekly ingestion** — scheduled job to pull upcoming fixtures and real results automatically (source TBD — likely an API-Football or similar live-fixtures API, not yet chosen).

## Resume framing (context, not a task)

Jonathan is building this in part for internship recruiting. Resume bullets already drafted around the model/backtest work (accuracy %, avg points, calibration finding) — those are considered "safe to use" since they're backed by real results. Bullets describing the backend/frontend/deployment are aspirational until those pieces are actually built — don't inflate claims about what exists.
