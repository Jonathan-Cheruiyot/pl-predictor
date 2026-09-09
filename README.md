# PL Predictor

A Premier League score prediction app where you compete head-to-head against a statistical model. Submit your scoreline before kickoff, watch the model's prediction reveal, and track who's winning over the season.

Built to answer a real question: can a gradient-boosted model beat a football fan's gut instinct over a full season?

---

## How scoring works

Both your prediction and the model's prediction are scored against the actual result after each match:

| Outcome | Points |
|---|---|
| Exact scoreline | 3 |
| Correct result (win/draw/loss), wrong score | 2 |
| Wrong result | 0 |

The leaderboard tracks cumulative points for you vs. the model across all scored matches.

---

## The model

**LightGBM** trained on 5 seasons of Premier League data (2020/21–2024/25, ~1,900 matches).

Features are computed strictly from matches *before* each fixture — no leakage:
- Rolling 6-game averages: goals scored/conceded, points per game
- Home/away split equivalents of the above
- Games played (proxy for squad stability / promoted-team uncertainty)

One multiclass classifier (home win / draw / away win) and two Poisson-objective regressors (home goals, away goals). The classifier's probabilities feed the win-probability bar shown after you submit; the regressors give the predicted scoreline.

Teams with no training history (newly promoted clubs like Hull City, Sunderland, Coventry) get league-average form as a fallback — a prediction is always generated, flagged internally as lower-confidence.

### Backtest results

Trained through ~March 2025, held-out test: 91 matches from April–May 2025:

| Model | Avg pts/match | Correct result | Exact score | Log loss |
|---|---|---|---|---|
| Dixon-Coles (baseline) | 0.78 | 35.2% | 7.7% | **0.980** |
| LightGBM | **1.23** | **53.8%** | **15.4%** | 1.017 |
| Naive (always predict 1–1) | 0.57 | — | — | — |

LightGBM wins on scoring-rule metrics; Dixon-Coles has slightly better-calibrated probabilities (lower log loss). LightGBM is what the live app uses.

---

## Features

**Fixtures**
- Live upcoming fixtures pulled from football-data.org, grouped by gameweek with a progressive load-more pattern
- Hero treatment for the next upcoming fixture; compact rows for the rest
- Predictions editable up until kickoff, then locked permanently

**Predictions**
- Score-stepper UI (tap +/− for each team)
- Model prediction hidden until after you submit — revealed with a flip-card animation
- Win-probability bar (home / draw / away) from the model's classifier output
- Edit button available for upcoming fixtures before kickoff; "Locked at kickoff" shown after

**Results**
- Full-time score displayed prominently on completed fixtures
- Points earned by you and the model shown per match
- Season totals (cumulative) shown inline on each completed fixture page

**Past Fixtures**
- Dedicated page showing all completed matches grouped by gameweek, most recent first
- Per-row colour coding: green (you beat the model), pink (model beat you), lavender (tied)

**Leaderboard**
- Head-to-head cumulative score: you vs. the model
- Average points per match for both
- Cumulative line chart over the season (pure SVG, no library)
- Multi-user table when there are additional players

**League Table**
- Live PL standings from football-data.org, refreshed every 5 minutes
- Top-4 UCL block with prominent treatment; compact rows for the rest
- Zone indicators: Champions League (cyan), Europa (pink), relegation (red)

**Team Pages**
- Full squad rosters from API-Football (free tier), cached 24 hours
- Players grouped by position (GK / DEF / MID / FWD), sorted by squad number
- Click any team in the table to open their page

---

## Tech stack

| Layer | Technology |
|---|---|
| ML modeling | Python, pandas, numpy, scipy, LightGBM, scikit-learn |
| Backend | FastAPI, SQLAlchemy, SQLite, python-dotenv, httpx |
| Frontend | React 18, TypeScript, Tailwind CSS v4, Vite |
| Live fixtures & standings | football-data.org API (free tier) |
| Squad rosters | API-Football / api-sports.io (free tier, 100 req/day) |
| Training data | football-data.co.uk via datahub.io (ODC-PDDL) |

---

## Project structure

```
pl-predictor/
├── season-2021.csv         # Historical match data (2020/21)
├── season-2122.csv         # 2021/22
├── season-2223.csv         # 2022/23
├── season-2324.csv         # 2023/24
├── season-2425.csv         # 2024/25
│
├── model.py                # Dixon-Coles model (MLE, bivariate Poisson + DC correction)
├── features.py             # Rolling-form feature engineering (no leakage)
├── compare_models.py       # Dixon-Coles vs LightGBM backtest
├── backtest.py             # Standalone Dixon-Coles backtest
│
├── backend/
│   ├── main.py             # FastAPI app — all endpoints
│   ├── predictor.py        # LightGBM wrapper (trains at startup, serves predictions)
│   ├── external.py         # Cached HTTP calls: football-data.org + API-Football
│   ├── aliases.py          # fd.org shortName → model training-data name mapping
│   ├── orm.py              # SQLAlchemy models: Fixture, ModelPrediction, UserPrediction, Score
│   ├── schemas.py          # Pydantic v2 request/response schemas
│   ├── database.py         # SQLite setup
│   ├── seed_past_gws.py    # Interactive backfill script for past gameweeks
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api.ts                      # Typed API client
        ├── crests.ts                   # Crest URL resolution (cached, fd.org name mapping)
        ├── teams.ts                    # Team colour map (27 clubs)
        ├── App.tsx                     # Router + layout
        ├── components/
        │   ├── Nav.tsx
        │   └── Crest.tsx               # Fixed-footprint crest image component
        └── pages/
            ├── FixturesPage.tsx        # Upcoming fixtures, gameweek nav, load-more
            ├── PastFixturesPage.tsx    # Completed fixtures browsable by gameweek
            ├── PredictionPage.tsx      # Score entry, model reveal, result display
            ├── LeaderboardPage.tsx     # Season standings + cumulative chart
            ├── LeaguePage.tsx          # Live PL table + zone indicators
            └── TeamPage.tsx            # Squad roster per team
```

---

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (interactive API docs)
```

Required environment variables in `backend/.env`:

```
FOOTBALL_DATA_KEY=your_football_data_org_key
API_FOOTBALL_KEY=your_api_football_key
DISABLE_KICKOFF_LOCK=false
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8000`.

### Backfilling past gameweeks

To interactively submit predictions for past matches (fetches real results from football-data.org):

```bash
# Set DISABLE_KICKOFF_LOCK=true in backend/.env, restart backend, then:
cd backend
python seed_past_gws.py
# Re-set DISABLE_KICKOFF_LOCK=false and restart when done
```

### Recording a result manually

```bash
curl -X POST http://localhost:8000/fixtures/{id}/result \
  -H "Content-Type: application/json" \
  -d '{"actual_home": 2, "actual_away": 1}'
```

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/fixtures` | List fixtures — syncs live upcoming matches from fd.org |
| `POST` | `/fixtures` | Create a fixture manually |
| `GET` | `/fixtures/{id}` | Single fixture |
| `POST` | `/fixtures/{id}/user-prediction` | Submit (or update) your prediction |
| `GET` | `/fixtures/{id}/user-prediction/{username}` | Retrieve your prediction |
| `GET` | `/fixtures/{id}/model-prediction?username=X` | Model prediction — **403 until you've submitted yours** |
| `POST` | `/fixtures/{id}/result` | Record result + auto-score all predictions |
| `GET` | `/leaderboard` | Cumulative user vs model totals |
| `GET` | `/leaderboard/history/{username}` | Per-fixture score history for chart |
| `GET` | `/league/standings` | Live PL table (cached 5 min) |
| `GET` | `/league/crests` | `{shortName: crestUrl}` map for all PL teams |
| `GET` | `/league/team/{team_short}/squad` | Squad roster (cached 24 h) |
| `GET` | `/teams` | All team names in the training data |

---

## Data sources

- **Training data:** [football-data.co.uk](http://www.football-data.co.uk/) via [datahub.io](https://datahub.io/football/english-premier-league), ODC-PDDL licensed
- **Live fixtures & standings:** [football-data.org](https://www.football-data.org/) free tier (10 req/min)
- **Squad rosters:** [API-Football](https://www.api-football.com/) free tier (100 req/day)
