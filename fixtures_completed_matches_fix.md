# Fix Fixtures page unevenness: completed matches are competing with the hero

## The problem

The Fixtures page currently has three visual tiers: the "NEXT UP" hero match
(large), the compact upcoming rows (small, good), and the completed match
cards at the bottom (still large — big crests, big score digits). That third
tier is too close in visual weight to the hero, so the page reads as having
two competing focal points instead of one clear hierarchy. This is the
"unevenness."

## The fix

Shrink the completed match cards significantly — they should read as clearly
subordinate to the hero, more like a compact log/history than a second hero
moment:

- Reduce crest size well below the hero's (the hero is ~80px per the last
  build) — bring completed matches down to roughly the same small scale as
  the compact upcoming rows, or only slightly larger, not close to hero scale
- Reduce the score digits significantly — they shouldn't be the same visual
  weight as anything in the hero section
- Consider condensing each completed match to a single line (crest, team,
  score, team, crest, all inline) rather than a multi-line stacked card —
  this matches the compact upcoming row treatment and reinforces that
  completed matches are reference/history, not something demanding attention
- The "RESULTS — N matches" section header can stay as-is (already
  appropriately de-emphasized)

## Goal

After this change, there should be exactly ONE large/prominent element on
the page (the next upcoming match), with everything else — both the compact
upcoming list and the completed matches — clearly and consistently secondary
to it. Not two tiers of "big," one tier of big and everything else small.
