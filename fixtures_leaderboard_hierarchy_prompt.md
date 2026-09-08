# Extend the hierarchy-breaking treatment to Fixtures and Leaderboard

The League Table page redesign (hero block for the leader, asymmetric layout,
zone color bars) worked well. Apply the same underlying principle — one
deliberately prominent element, uneven emphasis instead of uniform repetition
— to these two pages. They currently have the new color palette but still use
the old uniform stacked-card structure underneath.

## Fixtures page

- **Give the single nearest upcoming match a large hero treatment** at the
  top of the page — bigger crests, more space, similar scale to the League
  Table's leader hero block. This is "the one happening soonest," so it
  should visually read that way immediately.
- The rest of the upcoming fixtures list stays compact/dense below it — same
  "hero + compact list" pattern as the table's leader + rest of standings.
- Apply the same asymmetric, off-center layout shift used on the League
  Table page, rather than the current centered column.
- Completed/results section can stay closer to its current form for now —
  focus this pass on the upcoming fixtures list.

## Leaderboard page — bigger rework, not just a resize

A table with a single row (just the one user) reads as broken/empty — there's
a large void below it currently. Since this is fundamentally a head-to-head
(user vs. model), redesign it as a scoreboard moment rather than a table:

- **Large "YOU [pts] — [pts] MODEL" head-to-head display** as the dominant
  element on the page, in the same spirit as the Immortals "Final Score"
  reference (large score, whitespace over cards, minimal decoration) — this
  page has more room to lean into that than any other page in the app.
- Whoever is ahead should be visually emphasized (the neon green accent from
  the palette, larger weight, etc.) — same idea as GD coloring on the table.
- Below the head-to-head score, keep the existing scoring-rule reference
  (3/2/0 explanation), but de-emphasized/secondary — it's useful context, not
  the visual focus.
- If there's a simple way to show points accumulated over the season so far
  (even a basic line/bar comparison across completed gameweeks), that would
  fill the empty space meaningfully — optional if it adds real value, skip if
  it would need data we don't already have in a usable shape.

## Scope

Both pages, this pass. Don't touch the League Table or fixture detail/
prediction pages — those already have their hierarchy treatment.
