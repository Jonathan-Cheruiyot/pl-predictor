"""
Wraps the LightGBM model for serving predictions via the API.

At startup, trains on all 5 seasons of historical data and retains each
team's rolling form so predictions can be generated for upcoming fixtures.
"""
import numpy as np
import pandas as pd
import lightgbm as lgb
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent
_SEASON_FILES = [
    _DATA_DIR / "season-2021.csv",
    _DATA_DIR / "season-2122.csv",
    _DATA_DIR / "season-2223.csv",
    _DATA_DIR / "season-2324.csv",
    _DATA_DIR / "season-2425.csv",
]

_FEATURE_COLS = [
    "h_gf", "h_ga", "h_pts",
    "a_gf", "a_ga", "a_pts",
    "h_gf_home", "h_ga_home",
    "a_gf_away", "a_ga_away",
    "h_games_played", "a_games_played",
]

_WINDOW = 6
_DEFAULT_FORM = dict(gf=1.3, ga=1.3, pts=1.0, n=0)


def _load_data(files: list) -> pd.DataFrame:
    dfs = []
    for f in files:
        df = pd.read_csv(f, usecols=["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG"])
        dfs.append(df)
    data = pd.concat(dfs, ignore_index=True)
    data["Date"] = pd.to_datetime(data["Date"])
    return data.sort_values("Date").reset_index(drop=True)


def _form_stats(games: list, home_only: bool | None = None) -> dict:
    if home_only is not None:
        games = [g for g in games if g["is_home"] == home_only]
    games = games[-_WINDOW:]
    if not games:
        return _DEFAULT_FORM.copy()
    return dict(
        gf=float(np.mean([g["gf"] for g in games])),
        ga=float(np.mean([g["ga"] for g in games])),
        pts=float(np.mean([g["pts"] for g in games])),
        n=len(games),
    )


def _build_features(data: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Returns (feature_df, team_history) where history is the state after all matches."""
    teams = sorted(set(data.HomeTeam) | set(data.AwayTeam))
    history: dict[str, list] = {t: [] for t in teams}
    rows = []

    for _, r in data.iterrows():
        h, a = r.HomeTeam, r.AwayTeam
        hf = _form_stats(history[h])
        af = _form_stats(history[a])
        hfh = _form_stats(history[h], home_only=True)
        afa = _form_stats(history[a], home_only=False)

        rows.append({
            "Date": r.Date, "HomeTeam": h, "AwayTeam": a,
            "FTHG": r.FTHG, "FTAG": r.FTAG,
            "h_gf": hf["gf"], "h_ga": hf["ga"], "h_pts": hf["pts"],
            "a_gf": af["gf"], "a_ga": af["ga"], "a_pts": af["pts"],
            "h_gf_home": hfh["gf"], "h_ga_home": hfh["ga"],
            "a_gf_away": afa["gf"], "a_ga_away": afa["ga"],
            "h_games_played": hf["n"], "a_games_played": af["n"],
        })

        pts_h = 3 if r.FTHG > r.FTAG else (1 if r.FTHG == r.FTAG else 0)
        pts_a = 3 if r.FTAG > r.FTHG else (1 if r.FTHG == r.FTAG else 0)
        history[h].append({"gf": r.FTHG, "ga": r.FTAG, "pts": pts_h, "is_home": True})
        history[a].append({"gf": r.FTAG, "ga": r.FTHG, "pts": pts_a, "is_home": False})

    return pd.DataFrame(rows), history


class PLPredictor:
    """Trains on startup; call predict(home, away) to get a scoreline + win probs."""

    def __init__(self):
        data = _load_data(_SEASON_FILES)
        feat, self.team_history = _build_features(data)

        feat["result"] = np.where(
            feat.FTHG > feat.FTAG, 0,
            np.where(feat.FTHG == feat.FTAG, 1, 2),  # 0=H, 1=D, 2=A
        )
        X = feat[_FEATURE_COLS]

        self.clf = lgb.LGBMClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            num_class=3, objective="multiclass", verbosity=-1,
        )
        self.clf.fit(X, feat["result"])

        self.reg_h = lgb.LGBMRegressor(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            objective="poisson", verbosity=-1,
        )
        self.reg_h.fit(X, feat["FTHG"])

        self.reg_a = lgb.LGBMRegressor(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            objective="poisson", verbosity=-1,
        )
        self.reg_a.fit(X, feat["FTAG"])

        self.teams: set[str] = set(self.team_history.keys())

    def _make_features(self, home_team: str, away_team: str) -> pd.DataFrame:
        hf = _form_stats(self.team_history.get(home_team, []))
        af = _form_stats(self.team_history.get(away_team, []))
        hfh = _form_stats(self.team_history.get(home_team, []), home_only=True)
        afa = _form_stats(self.team_history.get(away_team, []), home_only=False)
        row = {
            "h_gf": hf["gf"], "h_ga": hf["ga"], "h_pts": hf["pts"],
            "a_gf": af["gf"], "a_ga": af["ga"], "a_pts": af["pts"],
            "h_gf_home": hfh["gf"], "h_ga_home": hfh["ga"],
            "a_gf_away": afa["gf"], "a_ga_away": afa["ga"],
            "h_games_played": hf["n"], "a_games_played": af["n"],
        }
        return pd.DataFrame([row])[_FEATURE_COLS]

    def predict(self, home_team: str, away_team: str) -> dict:
        """
        Returns:
            predicted_home, predicted_away: integer scoreline
            p_home_win, p_draw, p_away_win: outcome probabilities (sum to ~1)
            low_confidence: True when either team has no training history
                            (uses league-average form as fallback, never errors)
        """
        unknown = [t for t in (home_team, away_team) if t not in self.teams]

        X = self._make_features(home_team, away_team)
        probs = self.clf.predict_proba(X)[0]  # [p_home, p_draw, p_away]
        pred_h = int(np.round(self.reg_h.predict(X)[0]).clip(0))
        pred_a = int(np.round(self.reg_a.predict(X)[0]).clip(0))
        return {
            "predicted_home": pred_h,
            "predicted_away": pred_a,
            "p_home_win": float(probs[0]),
            "p_draw": float(probs[1]),
            "p_away_win": float(probs[2]),
            "low_confidence": bool(unknown),
        }
