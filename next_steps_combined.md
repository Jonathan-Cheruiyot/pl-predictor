# Combined next steps: Fixtures page fixes + LLM match recap feature

Three separate tasks in one file. Treat Part 1 and Part 2 as small, related
UI fixes to the Fixtures page. Treat Part 3 as a bigger, fully separate
feature — it should not affect or depend on Parts 1/2 in any way.

---

## Part 1: Fix hero fixture crest/text inconsistency (bug fix)

Home team crest (Man United) and away team crest (Tottenham) currently
render at different visual sizes — likely because crest images have
different natural aspect ratios (round vs. tall/narrow shapes like
Tottenham's cockerel) and aren't constrained to a fixed bounding box.

Fix: wrap both crest images in an identical fixed-size container (same
width AND height for home and away, no exceptions) with object-fit: contain
on the image so it scales to fit regardless of natural shape. Both crests
must occupy the exact same visual footprint.

Also: "Man United" and "Tottenham" text currently differ in size/color —
they should use the IDENTICAL className (font-size, font-weight, color).
Audit the hero component for any leftover conditional styling that treats
home vs. away differently; there should be none beyond left/right position.

While in there, check whether the same crest-sizing bug could affect other
crest displays in the app (compact rows, league table, team pages) — apply
the fixed-container + object-fit: contain pattern consistently everywhere
crests render, so this bug can't recur elsewhere.

## Part 2: Symmetric layout + brighter meta text for compact rows

**Symmetry:** the hero fixture already uses a symmetric flex-1 | vs | flex-1
layout. Apply the same symmetric structure to the compact upcoming rows
below it (Newcastle vs Aston Villa, Brighton vs Wolves, Everton vs
Brentford) — home team block and away team block should take equal width,
"vs" centered between them, same principle as the hero at compact scale.

**Meta text brightness:** small metadata text (GW1, dates/times, section
headers like "UPCOMING — 4 MATCHES") is currently a dim lavender-gray and
hard to read. Brighten it using the existing accent cyan (#04F5FF) — NOT
white. Reasoning: bold content (team names, scores) already uses white; if
meta text also goes white, everything converges to one brightness level and
the hierarchy between "primary content" and "supporting label" disappears.
Cyan is already the established secondary-accent color elsewhere (nav
active state). Apply consistently across Fixtures, and to the same pattern
on Table/Leaderboard if simple to extend — no other layout changes there.

---

## Part 3: LLM-generated match recaps (separate feature)

### Goal

After a match completes, generate a short natural-language recap + a brief
explanation of why the model predicted what it did, using an LLM. This is
NOT a new prediction mechanism — the model's actual prediction logic
(Dixon-Coles / LightGBM) is untouched. The LLM's only job is turning
already-computed structured data into readable prose.

### Critical: keep this fully isolated from the existing scoring flow

Do NOT add the LLM call into POST /fixtures/{id}/result or anything in the
existing scoring/leaderboard logic. That endpoint already works correctly
and must stay fast and dependency-free. Instead:

- New, separate endpoint: e.g. `GET /fixtures/{id}/recap`
- Generate the recap on-demand when this endpoint is first called, OR
  generate it async in the background after scoring completes — either way,
  it must never block or risk the existing result/scoring flow.
- Cache the generated recap once created (store it, e.g. a `recap` column on
  the fixture or a small separate table) so it's not regenerated on every
  page view — this also keeps LLM API costs down.

### What data feeds the recap

Use what's already computed and available for a completed fixture: final
score, the user's prediction, the model's prediction (including win
probability breakdown from Dixon-Coles), and the points each earned. Send
this structured data to the LLM with a prompt asking for:
1. A short (2-4 sentence) recap of the match result in a natural sports-
   commentary tone
2. A brief explanation of why the model predicted what it did, referencing
   its actual win-probability breakdown (not invented reasoning)

### Setup

- Use the Anthropic API
- API key goes in `backend/.env` as ANTHROPIC_API_KEY, loaded the same way
  the football-data.org key already is — never hardcoded
- Handle the case where the API call fails gracefully (show nothing or a
  simple fallback message, don't break the fixture detail page)

### Frontend

Add the recap as a new section on the fixture detail page, below the
existing Full Time / season totals sections. Keep it visually consistent
with the rest of the redesigned pages (same palette, similar restraint) —
this is supporting content, not another hero moment.

### Scope

Self-contained addition. Don't modify the prediction models, the scoring
logic, the standings/roster integrations, or any existing page layouts
beyond adding this one new section.
