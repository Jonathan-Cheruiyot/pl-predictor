# Fix gameweek display: current gameweek first, then "Load more" progressively

## The problem

The current gameweek navigation doesn't properly separate fixtures into
distinct per-gameweek sections. Fix this with a clear, incremental loading
pattern instead.

## Desired behavior

- On page load, show ONLY the current gameweek's fixtures (e.g. Gameweek 5),
  clearly labeled as its own section (e.g. a "Gameweek 5" header above its
  matches).
- Below that, a "Load more fixtures" button (or similar clear label).
- Clicking it loads and appends the NEXT gameweek as its own new section
  (e.g. "Gameweek 6" header + its matches, appended below Gameweek 5's
  section — not replacing it).
- Each click loads one additional gameweek, in order (6, then 7, then 8...),
  each clearly labeled and visually separated from the others.
- Once there are no more upcoming gameweeks with scheduled fixtures, the
  "Load more" button should disappear or show a clear end state (e.g.
  "No more fixtures scheduled") rather than doing nothing or erroring.

## Implementation notes

- This should use the matchday/gameweek field already available from the
  football-data.org fixtures data (Stage 1's live fixtures work) — group by
  matchday, don't need a new data source.
- Each gameweek section should keep whatever styling/hierarchy already
  exists (e.g. if there's a "next up" hero treatment for the single nearest
  match, that still applies within the first/current gameweek section only
  — subsequent loaded gameweeks are just their own labeled group of
  fixtures, no additional hero treatment needed for those).
- Keep this to the Fixtures page's upcoming-matches view. Past Fixtures
  (already added in Stage 1) can use a similar per-gameweek grouping if it
  doesn't already, but that's secondary — focus on getting upcoming
  fixtures right first.

## Scope

Fixtures page (upcoming matches view) only. Don't touch prediction editing
logic, Past Fixtures, League Table, Leaderboard, or roster data.
