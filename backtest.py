"""
Backtest: train on all data up to a cutoff, predict the held-out final
gameweeks of 2024/25, score using Jonathan's rule (0/2/3 points).
"""
import pandas as pd
import numpy as np
from model import DixonColes, load_data

data = load_data([
    "data/season-2223.csv",
    "data/season-2324.csv",
    "data/season-2425.csv",
])

cutoff = pd.Timestamp("2025-04-01")
train = data[data["Date"] < cutoff].reset_index(drop=True)
test = data[data["Date"] >= cutoff].reset_index(drop=True)
print(f"Train: {len(train)} matches (through {train.Date.max().date()})")
print(f"Test:  {len(test)} matches ({test.Date.min().date()} to {test.Date.max().date()})")

model = DixonColes()
res = model.fit(train)
print(f"Fit converged: {res.success}\n")

def score_prediction(pred_h, pred_a, actual_h, actual_a):
    pred_result = "H" if pred_h > pred_a else ("A" if pred_a > pred_h else "D")
    actual_result = "H" if actual_h > actual_a else ("A" if actual_a > actual_h else "D")
    if pred_h == actual_h and pred_a == actual_a:
        return 3
    elif pred_result == actual_result:
        return 2
    else:
        return 0

total_points = 0
correct_result = 0
exact_score = 0
n = 0
for _, row in test.iterrows():
    if row.HomeTeam not in model.idx or row.AwayTeam not in model.idx:
        continue
    pred = model.predict(row.HomeTeam, row.AwayTeam)
    ph, pa = pred["predicted_score"]
    pts = score_prediction(ph, pa, row.FTHG, row.FTAG)
    total_points += pts
    if pts >= 2:
        correct_result += 1
    if pts == 3:
        exact_score += 1
    n += 1

print(f"Held-out matches scored: {n}")
print(f"Total points (0/2/3 rule): {total_points} / {n*3} max")
print(f"Avg points per match: {total_points/n:.2f}")
print(f"Correct result rate: {correct_result/n:.1%}")
print(f"Exact scoreline rate: {exact_score/n:.1%}")

# baseline comparison: always predict most common scoreline (1-1) and separately "home win 1-0"
baseline_pts = sum(score_prediction(1, 1, r.FTHG, r.FTAG) for _, r in test.iterrows()
                    if r.HomeTeam in model.idx and r.AwayTeam in model.idx)
print(f"\nNaive baseline (always predict 1-1): {baseline_pts} pts, {baseline_pts/n:.2f} avg")
