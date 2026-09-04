"""
Compare Dixon-Coles vs a gradient-boosted (LightGBM) baseline on the
same held-out matches, using Jonathan's scoring rule (0/2/3 pts).
"""
import pandas as pd
import numpy as np
from model import DixonColes, load_data
from features import build_features
import lightgbm as lgb
from sklearn.metrics import accuracy_score, log_loss

SEASON_FILES = [
    "data/season-2021.csv", "data/season-2122.csv", "data/season-2223.csv",
    "data/season-2324.csv", "data/season-2425.csv",
]

def score_prediction(pred_h, pred_a, actual_h, actual_a):
    pred_result = "H" if pred_h > pred_a else ("A" if pred_a > pred_h else "D")
    actual_result = "H" if actual_h > actual_a else ("A" if actual_a > actual_h else "D")
    if pred_h == actual_h and pred_a == actual_a:
        return 3
    elif pred_result == actual_result:
        return 2
    return 0

# ---- Load & split ----
data = load_data(SEASON_FILES)
print(f"Total matches loaded: {len(data)} ({data.Date.min().date()} to {data.Date.max().date()})")

cutoff = pd.Timestamp("2025-04-01")
train_raw = data[data["Date"] < cutoff].reset_index(drop=True)
test_raw = data[data["Date"] >= cutoff].reset_index(drop=True)
print(f"Train: {len(train_raw)} matches | Test: {len(test_raw)} matches\n")

# ---- Dixon-Coles ----
print("=" * 50)
print("DIXON-COLES")
print("=" * 50)
dc = DixonColes()
dc.fit(train_raw)

dc_points, dc_correct, dc_exact, dc_logloss_terms = 0, 0, 0, []
n = 0
for _, row in test_raw.iterrows():
    if row.HomeTeam not in dc.idx or row.AwayTeam not in dc.idx:
        continue
    pred = dc.predict(row.HomeTeam, row.AwayTeam)
    ph, pa = pred["predicted_score"]
    pts = score_prediction(ph, pa, row.FTHG, row.FTAG)
    dc_points += pts
    dc_correct += (pts >= 2)
    dc_exact += (pts == 3)
    actual_result = "H" if row.FTHG > row.FTAG else ("A" if row.FTAG > row.FTHG else "D")
    probs = {"H": pred["p_home_win"], "D": pred["p_draw"], "A": pred["p_away_win"]}
    dc_logloss_terms.append(-np.log(max(probs[actual_result], 1e-10)))
    n += 1

print(f"Matches scored: {n}")
print(f"Total points: {dc_points}/{n*3}  (avg {dc_points/n:.2f})")
print(f"Correct result: {dc_correct/n:.1%} | Exact score: {dc_exact/n:.1%}")
print(f"Log loss (result): {np.mean(dc_logloss_terms):.3f}")

# ---- Gradient-boosted baseline ----
print()
print("=" * 50)
print("GRADIENT-BOOSTED (LightGBM)")
print("=" * 50)

feat = build_features(data)
feat["result"] = np.where(feat.FTHG > feat.FTAG, 0, np.where(feat.FTHG == feat.FTAG, 1, 2))  # 0=H,1=D,2=A

feature_cols = ["h_gf", "h_ga", "h_pts", "a_gf", "a_ga", "a_pts",
                 "h_gf_home", "h_ga_home", "a_gf_away", "a_ga_away",
                 "h_games_played", "a_games_played"]

train_feat = feat[feat["Date"] < cutoff].reset_index(drop=True)
test_feat = feat[feat["Date"] >= cutoff].reset_index(drop=True)

# classifier for match result (H/D/A)
clf = lgb.LGBMClassifier(n_estimators=200, max_depth=4, learning_rate=0.05,
                          num_class=3, objective="multiclass", verbosity=-1)
clf.fit(train_feat[feature_cols], train_feat["result"])

# regressors for scoreline (poisson objective, since goals are counts)
reg_h = lgb.LGBMRegressor(n_estimators=200, max_depth=4, learning_rate=0.05,
                           objective="poisson", verbosity=-1)
reg_a = lgb.LGBMRegressor(n_estimators=200, max_depth=4, learning_rate=0.05,
                           objective="poisson", verbosity=-1)
reg_h.fit(train_feat[feature_cols], train_feat["FTHG"])
reg_a.fit(train_feat[feature_cols], train_feat["FTAG"])

result_probs = clf.predict_proba(test_feat[feature_cols])
pred_h_goals = np.round(reg_h.predict(test_feat[feature_cols])).astype(int).clip(0)
pred_a_goals = np.round(reg_a.predict(test_feat[feature_cols])).astype(int).clip(0)

gb_points, gb_correct, gb_exact = 0, 0, 0
gb_logloss_terms = []
n2 = 0
for i, row in test_feat.iterrows():
    pts = score_prediction(pred_h_goals[i], pred_a_goals[i], row.FTHG, row.FTAG)
    gb_points += pts
    gb_correct += (pts >= 2)
    gb_exact += (pts == 3)
    actual_idx = int(row.result)  # 0=H,1=D,2=A
    gb_logloss_terms.append(-np.log(max(result_probs[i, actual_idx], 1e-10)))
    n2 += 1

print(f"Matches scored: {n2}")
print(f"Total points: {gb_points}/{n2*3}  (avg {gb_points/n2:.2f})")
print(f"Correct result: {gb_correct/n2:.1%} | Exact score: {gb_exact/n2:.1%}")
print(f"Log loss (result): {np.mean(gb_logloss_terms):.3f}")

# ---- Summary ----
print()
print("=" * 50)
print("SUMMARY")
print("=" * 50)
print(f"{'Model':<20}{'Avg pts':<12}{'Result acc':<14}{'Exact score':<14}{'Log loss':<10}")
print(f"{'Dixon-Coles':<20}{dc_points/n:<12.2f}{dc_correct/n:<14.1%}{dc_exact/n:<14.1%}{np.mean(dc_logloss_terms):<10.3f}")
print(f"{'LightGBM':<20}{gb_points/n2:<12.2f}{gb_correct/n2:<14.1%}{gb_exact/n2:<14.1%}{np.mean(gb_logloss_terms):<10.3f}")
