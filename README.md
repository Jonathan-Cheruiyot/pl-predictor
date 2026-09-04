# PL Predictor

A Premier League match predictor that goes head-to-head with you. The model predicts a scoreline for every fixture, you make your own prediction before kickoff, and both get scored against what actually happens. Closest score wins the gameweek.

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

LightGBM wins on the metrics that matter for scoring (points, accuracy), but Dixon-Coles has slightly better-calibrated probabilities (lower log loss), a reminder that the "best" model depends on what you're optimizing for. LightGBM's predictions are what the app uses to compete against the user, since that's what the scoring rule rewards.

## Data

Historical match results (2020/21–2024/25 seasons) sourced from [football-data.co.uk](http://www.football-data.co.uk/) via the [datahub.io mirror](https://datahub.io/football/english-premier-league), licensed under [ODC-PDDL](http://opendatacommons.org/licenses/pddl/). Includes full-time/half-time scores, shots, corners, cards, and referee per match.

## Project structure

```
pl-predictor/
├── data/                   # Historical season CSVs (2020/21–2024/25)
├── model.py                # Dixon-Coles model
├── features.py             # Rolling-form feature engineering (no leakage)
├── compare_models.py       # Dixon-Coles vs LightGBM backtest comparison
├── backtest.py             # Standalone Dixon-Coles backtest
└── README.md
```

## Running it

```bash
pip install pandas numpy scipy lightgbm scikit-learn

# Fit Dixon-Coles and see sample predictions
python3 model.py

# Backtest Dixon-Coles alone
python3 backtest.py

# Compare Dixon-Coles vs LightGBM
python3 compare_models.py
```

## Roadmap

- [x] Dixon-Coles baseline model
- [x] LightGBM comparison + backtest
- [ ] FastAPI backend (fixtures, predictions, scoring, leaderboard)
- [ ] Weekly automated fixture ingestion + result scoring
- [ ] React/TypeScript frontend for making and viewing predictions
- [ ] User accounts + running leaderboard vs the model over a season

## Tech stack

Python (pandas, numpy, scipy, LightGBM, scikit-learn) for modeling · FastAPI planned for the backend · React/TypeScript planned for the frontend · PostgreSQL/Supabase planned for storage
