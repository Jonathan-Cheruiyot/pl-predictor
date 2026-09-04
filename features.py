"""
Rolling-form feature engineering for the gradient-boosted baseline.
All features for a match use ONLY data strictly before that match's date
(no leakage) - computed via expanding/rolling windows per team.
"""
import pandas as pd
import numpy as np

def build_features(data, window=6):
    data = data.sort_values("Date").reset_index(drop=True)
    teams = sorted(set(data.HomeTeam) | set(data.AwayTeam))
    # history[team] = list of dicts with goals_for, goals_against, points, is_home
    history = {t: [] for t in teams}

    rows = []
    for _, r in data.iterrows():
        h, a = r.HomeTeam, r.AwayTeam

        def form(team, home_only=None):
            games = history[team]
            if home_only is not None:
                games = [g for g in games if g["is_home"] == home_only]
            games = games[-window:]
            if len(games) == 0:
                return dict(gf=1.3, ga=1.3, pts=1.0, n=0)
            gf = np.mean([g["gf"] for g in games])
            ga = np.mean([g["ga"] for g in games])
            pts = np.mean([g["pts"] for g in games])
            return dict(gf=gf, ga=ga, pts=pts, n=len(games))

        h_form = form(h)
        a_form = form(a)
        h_form_home = form(h, home_only=True)
        a_form_away = form(a, home_only=False)

        rows.append({
            "Date": r.Date, "HomeTeam": h, "AwayTeam": a,
            "FTHG": r.FTHG, "FTAG": r.FTAG,
            "h_gf": h_form["gf"], "h_ga": h_form["ga"], "h_pts": h_form["pts"],
            "a_gf": a_form["gf"], "a_ga": a_form["ga"], "a_pts": a_form["pts"],
            "h_gf_home": h_form_home["gf"], "h_ga_home": h_form_home["ga"],
            "a_gf_away": a_form_away["gf"], "a_ga_away": a_form_away["ga"],
            "h_games_played": h_form["n"], "a_games_played": a_form["n"],
        })

        # update history AFTER using it for this match
        pts_h = 3 if r.FTHG > r.FTAG else (1 if r.FTHG == r.FTAG else 0)
        pts_a = 3 if r.FTAG > r.FTHG else (1 if r.FTHG == r.FTAG else 0)
        history[h].append({"gf": r.FTHG, "ga": r.FTAG, "pts": pts_h, "is_home": True})
        history[a].append({"gf": r.FTAG, "ga": r.FTHG, "pts": pts_a, "is_home": False})

    return pd.DataFrame(rows)
