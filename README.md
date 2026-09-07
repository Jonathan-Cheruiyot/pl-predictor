# PL Predictor

A Premier League match predictor that goes head-to-head with you. The model predicts a scoreline for every fixture, you make your own prediction before kickoff, and both get scored against what actually happens.

Built to answer a simple question: can a statistical model beat a football fan's gut instinct over a season?

## How scoring works

Both the model's prediction and your prediction are scored against the actual result:

| Outcome | Points |
|---|---|
| Exact scoreline | 3 |
| Correct winner/draw, wrong score | 2 |
| Wrong outcome | 0 |

## The model(s)

Two approaches were built and compared head-to-head rather than picking one blind:

**Dixon-Coles** — the classical statistical approach to football prediction. Estimates each team's attack and defense strength from historical goals, then models scorelines as a bivariate Poisson distribution with the Dixon-Coles low-score correction (accounts for the fact that 0-0, 1-0, 0-1, and 1-1 occur more often than a plain Poisson model predicts).

**LightGBM (gradient boosting)** — trained on rolling-form features (recent goals scored/conceded, points per game, home/away splits) computed strictly from data before each match, with no leakage. One classifier for match outcome (H/D/A), two Poisson-objective regressors for home/away goals.

### Backtest results

Both models trained on 5 seasons (2020/21–2024/25, ~1,900 matches), backtested on 91 held-out matches from April–May 2025:

| Model | Avg points/match | Correct result | Exact score | Log loss |
|---|---|---|---|---|
| Dixon-Coles | 0.78 | 35.2% | 7.7% | **0.980** |
| LightGBM | **1.23** | **53.8%** | **15.4%** | 1.017 |

LightGBM wins on the metrics that matter for scoring (points, accuracy), but Dixon-Coles has slightly better-calibrated probabilities (lower log loss) — a reminder that the "best" model depends on what you're optimizing for. LightGBM's predictions are what the live app uses, since that's what the scoring rule rewards.

Naive baseline (always predict 1-1): 0.57 avg points/match.

## Data

Historical match results (2020/21–2024/25 seasons) sourced from [football-data.co.uk](http://www.football-data.co.uk/) via the [datahub.io mirror](https://datahub.io/football/english-premier-league), licensed under [ODC-PDDL](http://opendatacommons.org/licenses/pddl/). Includes full-time/half-time scores, shots, corners, cards, and referee per match.

## Project structure

```
pl-predictor/
├── season-2021.csv         # Historical match data (2020/21)
├── season-2122.csv         # 2021/22
├── season-2223.csv         # 2022/23
├── season-2324.csv         # 2023/24
├── season-2425.csv         # 2024/25
│
├── model.py                # Dixon-Coles model (MLE, bivariate Poisson, DC correction)
├── features.py             # Rolling-form feature engineering (no leakage)
├── compare_models.py       # Dixon-Coles vs LightGBM backtest
├── backtest.py             # Standalone Dixon-Coles backtest
│
├── backend/
│   ├── main.py             # FastAPI app — all endpoints
│   ├── predictor.py        # LightGBM wrapper (trains at startup, serves predictions)
│   ├── orm.py              # SQLAlchemy models: Fixture, ModelPrediction, UserPrediction, Score
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── database.py         # SQLite setup (SQLAlchemy)
│   ├── seed.py             # Seeds sample fixtures for local dev
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api.ts          # Typed API client
    │   ├── teams.ts        # Team color map (27 PL clubs)
    │   ├── App.tsx         # Router
    │   ├── pages/
    │   │   ├── FixturesPage.tsx     # Fixture list (upcoming + completed)
    │   │   ├── PredictionPage.tsx   # Score entry + model reveal
    │   │   └── LeaderboardPage.tsx  # Season standings vs the model
    │   └── components/
    │       ├── Nav.tsx
    │       └── TeamBadge.tsx
    └── package.json
```

## API

The FastAPI backend runs on `localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/fixtures` | List fixtures (`?status=upcoming\|completed`, `?gameweek=N`) |
| `POST` | `/fixtures` | Create a fixture (auto-generates model prediction) |
| `GET` | `/fixtures/{id}` | Single fixture detail |
| `POST` | `/fixtures/{id}/user-prediction` | Submit your scoreline |
| `GET` | `/fixtures/{id}/user-prediction/{username}` | Retrieve your prediction |
| `GET` | `/fixtures/{id}/model-prediction?username=X` | Model's prediction — **returns 403 until you've submitted yours** |
| `POST` | `/fixtures/{id}/result` | Record actual result (auto-scores everyone using 3/2/0 rule) |
| `GET` | `/leaderboard` | Running totals: user vs model |
| `GET` | `/teams` | All 27 teams in the training data |

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Seed a few upcoming fixtures for testing:

```bash
python seed.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Recording a result (manual, until ingestion is built)

Once a match has been played, POST the actual score to trigger scoring:

```bash
curl -X POST http://localhost:8000/fixtures/1/result \
  -H "Content-Type: application/json" \
  -d '{"actual_home": 2, "actual_away": 1}'
```

This marks the fixture completed and updates the leaderboard automatically.

### Running the model comparison

```bash
pip install pandas numpy scipy lightgbm scikit-learn
python compare_models.py
```

## Roadmap

- [x] Dixon-Coles baseline model
- [x] LightGBM comparison + backtest
- [x] FastAPI backend (fixtures, predictions, scoring endpoints, leaderboard)
- [x] React/TypeScript frontend (fixture list, score entry, model reveal, leaderboard)
- [ ] Automated fixture ingestion + result scoring (scheduled job, live data API TBD)
- [ ] Supabase/PostgreSQL migration (replacing SQLite)
- [ ] User accounts + auth
- [ ] Deployment

## Tech stack

Python · pandas · numpy · scipy · LightGBM · scikit-learn · FastAPI · SQLite (SQLAlchemy) · React · TypeScript · Tailwind CSS · Vite
