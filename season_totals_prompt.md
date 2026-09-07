Let's add a feature to the completed fixtures view.

## What I want

Right now, clicking a completed fixture presumably just shows the two predictions
and the final score. I want to extend that view so that when a user clicks into
a completed game, they see:

1. The final score (already exists, keep as is)
2. Both predictions side by side (already exists, keep as is)
3. NEW: a running season-total comparison — my total points vs. the model's
   total points, accumulated across every completed fixture so far this season
   (not just this one game)

## Where the data comes from

GET /leaderboard already returns running totals for user vs. model — reuse that,
don't duplicate the scoring logic. If the current leaderboard endpoint only
returns a flat total and not something easily embeddable in this view, either:
- call it separately from the fixture detail page, or
- extend the fixture detail response to include the season totals as of that
  point, whichever is simpler given how the backend is currently structured.
Your call on which approach fits the existing code better.

## Design

Keep it consistent with the flip-card reveal style already built — this should
feel like a natural extension of that view, not a bolted-on separate section.
A simple side-by-side "You: X pts — Model: Y pts" with whoever's ahead visually
emphasized (color, weight, a small indicator) would work well. Doesn't need to
be elaborate — the flip-card reveal is still the main visual moment of the app,
this is a secondary detail.

Small and focused — this shouldn't require touching the prediction flow or the
model reveal animation, just the completed-fixture view.
