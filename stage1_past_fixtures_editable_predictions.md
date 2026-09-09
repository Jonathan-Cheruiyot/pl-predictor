# Stage 1: Past Fixtures section + editable predictions until kickoff

Two related frontend/prediction-flow features, handle together.

---

## Part 1: Past Fixtures section

Add a "Past Fixtures" section/page, separate from the gameweek navigation
already being added for upcoming matches. This should let the user browse
ALL old completed fixtures and results — not just the current or most
recent gameweek, but the full history of completed matches, ideally
browsable by gameweek the same way upcoming fixtures are.

- Add a clear entry point (nav link or section on the Fixtures page) labeled
  "Past Fixtures" that leads to this view
- Show completed matches (final score, both predictions, points earned) —
  reuse existing completed-match card styling already established
- Browsable by gameweek if that's a natural fit given the gameweek nav
  already being built for upcoming fixtures; otherwise a simple
  reverse-chronological list is fine

## Part 2: Editable predictions until kickoff, locked after

Predictions should be freely editable as many times as the user wants,
right up until the fixture's kickoff time. Once kickoff has passed, the
prediction locks permanently — no further edits, regardless of whether the
match has finished yet or is still in progress/finished.

- If prediction submission is currently a one-time-only action, change it to
  allow resubmission/editing up until kickoff time (check the kickoff
  timestamp server-side before accepting an edit, don't just rely on
  frontend state)
- After kickoff, the submit/edit UI should clearly indicate the prediction
  is locked (e.g. disabled form, "Locked at kickoff" message) rather than
  silently failing or still appearing editable
- This applies to the user's own prediction only — the model's prediction
  logic is unaffected

## Scope

Fixtures-page/prediction-flow changes only. Don't touch the League Table,
Leaderboard, roster data, or the model's prediction logic.
