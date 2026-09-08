# Upgrade the prediction section: crests instead of dots, Immortals-inspired layout

## What to change

The "Your Call" and "The Model" prediction cards (and the "Full Time" section
if it still uses dots) currently show small colored dots next to team names.
Replace these with real team crests — we already have crest URLs from
football-data.org (same source powering the league table), so no new API call
is needed. Reuse whatever crest data is already being fetched for /league.

## Layout inspiration from Immortals

Apply the same principles used in the league table and score redesign work:
- Crests should be large enough to be a real visual anchor, not a small icon
  next to text — think closer to the scale of the flags in the Immortals
  "Final Score" reference (attached previously), sized proportionally for
  club crests rather than flags.
- Let the crest + score be the dominant visual elements of each prediction
  card. Team names can be smaller/secondary since the crest now carries most
  of the identity.
- Keep the existing card structure (Your Call / The Model side by side) if it
  still works well with larger crests — don't over-restructure something
  that's already functioning, just upgrade the visual treatment within it.
- Maintain consistency with the Full Time section redesign already done —
  this should feel like the same design language applied consistently across
  the whole fixture detail page, not a distinct style.

## Scope

This is a visual-only change to the prediction and full-time sections of the
fixture detail page. Don't touch the league table, team pages, or leaderboard
in this pass — those already have their own crest treatment from the league
table work.
