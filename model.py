"""
Dixon-Coles style Premier League match predictor (vectorized for speed).
"""
import pandas as pd
import numpy as np
from scipy.optimize import minimize
from scipy.stats import poisson

def load_data(paths):
    dfs = []
    for p in paths:
        df = pd.read_csv(p, usecols=["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG"])
        dfs.append(df)
    data = pd.concat(dfs, ignore_index=True)
    data["Date"] = pd.to_datetime(data["Date"])
    data = data.sort_values("Date").reset_index(drop=True)
    return data

def dc_decay_weight(dates, xi=0.0018):
    most_recent = dates.max()
    days_ago = (most_recent - dates).dt.days.values
    return np.exp(-xi * days_ago)

def tau_vec(x, y, lam, mu, rho):
    """Vectorized Dixon-Coles correction."""
    out = np.ones_like(lam)
    m00 = (x == 0) & (y == 0)
    m01 = (x == 0) & (y == 1)
    m10 = (x == 1) & (y == 0)
    m11 = (x == 1) & (y == 1)
    out[m00] = 1 - lam[m00] * mu[m00] * rho
    out[m01] = 1 + lam[m01] * rho
    out[m10] = 1 + mu[m10] * rho
    out[m11] = 1 - rho
    return out

class DixonColes:
    def fit(self, data):
        teams = sorted(set(data.HomeTeam) | set(data.AwayTeam))
        self.teams = teams
        n = len(teams)
        idx = {t: i for i, t in enumerate(teams)}
        self.idx = idx

        home_idx = data.HomeTeam.map(idx).values
        away_idx = data.AwayTeam.map(idx).values
        x = data.FTHG.values.astype(float)
        y = data.FTAG.values.astype(float)
        w = dc_decay_weight(data["Date"])

        # free params: attack[1..n-1] (attack[0] fixed=0), defense[0..n-1], home_adv, rho
        def unpack(p):
            attack = np.concatenate(([0.0], p[:n-1]))
            defense = p[n-1:2*n-1]
            home_adv = p[2*n-1]
            rho = p[2*n]
            return attack, defense, home_adv, rho

        def neg_log_lik(p):
            attack, defense, home_adv, rho = unpack(p)
            lam = np.exp(home_adv + attack[home_idx] + defense[away_idx])
            mu = np.exp(attack[away_idx] + defense[home_idx])
            logp = poisson.logpmf(x, lam) + poisson.logpmf(y, mu)
            corr = tau_vec(x, y, lam, mu, rho)
            corr = np.clip(corr, 1e-6, None)
            logp = logp + np.log(corr)
            return -(w * logp).sum()

        x0 = np.zeros(2*n + 1)
        x0[2*n-1] = 0.25  # home advantage
        x0[2*n] = -0.05   # rho

        res = minimize(neg_log_lik, x0, method="L-BFGS-B",
                        options={"maxiter": 150})
        self.params = res.x
        return res

    def predict_score_matrix(self, home_team, away_team, max_goals=8):
        n = len(self.teams)
        attack = np.concatenate(([0.0], self.params[:n-1]))
        defense = self.params[n-1:2*n-1]
        home_adv = self.params[2*n-1]
        rho = self.params[2*n]
        hi, ai = self.idx[home_team], self.idx[away_team]
        lam = np.exp(home_adv + attack[hi] + defense[ai])
        mu = np.exp(attack[ai] + defense[hi])
        gx = np.arange(max_goals+1)
        px = poisson.pmf(gx, lam)
        py = poisson.pmf(gx, mu)
        matrix = np.outer(px, py)
        for xx in [0, 1]:
            for yy in [0, 1]:
                matrix[xx, yy] *= tau_vec(np.array([xx]), np.array([yy]), np.array([lam]), np.array([mu]), rho)[0]
        matrix /= matrix.sum()
        return matrix, lam, mu

    def predict(self, home_team, away_team):
        matrix, lam, mu = self.predict_score_matrix(home_team, away_team)
        best_score = np.unravel_index(np.argmax(matrix), matrix.shape)
        p_home = np.tril(matrix, -1).sum()
        p_draw = np.trace(matrix)
        p_away = np.triu(matrix, 1).sum()
        return {
            "predicted_score": best_score,
            "prob_score": matrix[best_score],
            "p_home_win": p_home,
            "p_draw": p_draw,
            "p_away_win": p_away,
            "expected_goals": (lam, mu),
        }

if __name__ == "__main__":
    data = load_data([
        "data/season-2223.csv",
        "data/season-2324.csv",
        "data/season-2425.csv",
    ])
    print(f"Loaded {len(data)} matches, {data.Date.min().date()} to {data.Date.max().date()}")
    print(f"Teams: {len(set(data.HomeTeam) | set(data.AwayTeam))}")

    model = DixonColes()
    res = model.fit(data)
    print(f"Optimization success: {res.success}, final -logL: {res.fun:.2f}, iters: {res.nit}")

    test_fixtures = [
        ("Arsenal", "Chelsea"),
        ("Man City", "Liverpool"),
        ("Man United", "Arsenal"),
    ]
    for home, away in test_fixtures:
        pred = model.predict(home, away)
        print(f"\n{home} vs {away}")
        print(f"  Predicted score: {pred['predicted_score']} (p={pred['prob_score']:.3f})")
        print(f"  Win probs: Home {pred['p_home_win']:.2%} / Draw {pred['p_draw']:.2%} / Away {pred['p_away_win']:.2%}")
        print(f"  Expected goals: {pred['expected_goals'][0]:.2f} - {pred['expected_goals'][1]:.2f}")
