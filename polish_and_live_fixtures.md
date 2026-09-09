# Contrast fixes (Table/Leaderboard/Prediction) + live fixtures integration

Two separate tasks in one file — Part 1 is a quick contrast/readability
pass, Part 2 is a bigger data-source change. Handle Part 1 first since it's
small and self-contained, then Part 2.

---

## Part 1: Fix low-contrast text across Table, Leaderboard, and Prediction pages

Several secondary labels across the app are currently too low-contrast to
read comfortably against the dark purple background — this went past
"appropriately de-emphasized" into "hard to read." Fix each of these
specifically, keeping the existing hierarchy (bold white = primary content,
cyan = secondary accent labels) but making sure nothing drops below a
legible contrast level, even when intentionally secondary.

### League Table page

- **Column headers ("P", "W", "D", "L", "GD", "PTS")** are currently too dim.
  Brighten to a legible light gray/lavender — doesn't need to be as bright as
  the cyan accent, but must be clearly readable, not near-invisible.
- **Position numbers for teams ranked outside the top group** (e.g. Everton
  at 8, Leeds at 9) are currently barely visible against the background.
  Brighten these — they can still be visually secondary to the bold top-4
  block, but they need to be legible at a glance, not squint-to-read.

### Prediction/fixture detail page

- **"YOUR CALL" label** is currently dim and inconsistent with "THE MODEL"
  label, which already got the bright cyan treatment. Bring "YOUR CALL" up
  to a comparable legibility level — doesn't need to be the same cyan (fine
  for them to be visually distinct), but "YOUR CALL" should not read as
  noticeably harder to see than "THE MODEL" sitting right next to it.

### Leaderboard page

- **"YOUR AVG" / "MODEL AVG" labels** are currently dim — brighten to a
  legible level, consistent with how "SEASON SO FAR" was already fixed to
  cyan in an earlier pass.
- Check the dashed "Model" line/legend area at the bottom of the chart —
  if any text there is similarly too dim, bring it up to the same standard.

### General principle

Secondary/label text can and should still be visually subordinate to bold
primary content — that hierarchy is correct and should stay. The fix is
specifically for text that has crossed from "subordinate" into "hard to
actually read." When in doubt, err toward more legible.

### Scope for Part 1

Table, Leaderboard, and Prediction pages only. Don't touch the Fixtures
page (already addressed in a previous pass) or restructure any layouts —
this is a contrast/color adjustment pass, not a layout change.

---

## Part 2: Replace hardcoded/manually-seeded fixtures with real upcoming fixtures

### Goal

The Fixtures page currently shows manually-seeded matches (from seed.py).
Replace this with real upcoming Premier League fixtures pulled from
football-data.org — the same API and key already used for the league
table, so no new integration is needed.

### Endpoint

`GET https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED`

- Same auth header already in use: `X-Auth-Token: YOUR_API_KEY`
- Returns matches with date/time, matchday, home team, away team (each
  including a crest URL — reuse this the same way the standings crests
  are already used, no separate crest lookup needed for these teams)
- Respect the same 10 req/min rate limit already accounted for elsewhere —
  cache this response too (a shorter cache than standings makes sense here
  since kickoff times matter, but don't call it on every page load —
  something like a 15-30 min cache is reasonable)

### What to change

- New backend endpoint (or update the existing one that currently serves
  seeded fixtures) to fetch and return real scheduled matches instead of
  reading from the manually-seeded table
- Map the API's match data to whatever shape the frontend already expects
  (it currently renders date, matchday/GW, home/away team + crest — the
  football-data.org response should cover all of this)
- The prediction submission and model-prediction flow should keep working
  exactly as before — this change is only about WHERE the fixture list
  comes from, not how predictions/scoring work once a fixture exists

### What to keep

- Completed/results matches: recommend keeping OUR database as the source
  of truth for completed/results (since those are tied to actual
  predictions and scores), and using football-data.org specifically for the
  UPCOMING fixtures list going forward.
- seed.py can be removed or left as a fallback/dev tool — your call based
  on whether it's still useful for local testing without hitting the API.

### Scope for Part 2

This is specifically about the fixtures data source. Don't change the
prediction flow, scoring logic, league table, or any UI beyond what's
needed to render real fixture data instead of seeded data.
