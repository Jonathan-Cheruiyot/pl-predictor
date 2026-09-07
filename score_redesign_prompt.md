# Redesign the Full Time score section — Immortals-inspired

I'm attaching a reference screenshot from theimmortals.world (a World Cup history
site by designer Jason Jerez). I want to borrow specific design principles from
it for our "Full Time" score display — NOT recreate the site directly. Keep our
dark mode and existing green/team-color accents; don't switch to their light theme.

## What to take from the reference

1. **Make the score itself dramatically bigger.** In the reference, the score
   ("4 — 2") is the single dominant visual element on the page — far larger than
   any other text. Right now our score sits at a similar scale to surrounding
   text. Push it to be the clear visual centerpiece of the Full Time card —
   think headline-scale, not just "bold."

2. **Use whitespace instead of a bordered card for this section specifically.**
   The reference has no card border around the score/flags/names — it just sits
   directly on the background with generous spacing. Try removing the card
   border/background from the Full Time section (keep borders elsewhere if they
   still make sense) and let it breathe instead.

3. **Give team identity more visual weight.** The reference uses large flags as
   anchors next to the score. We don't have flags (club football, not
   international) — but our current colored dots are too small to do the same
   job. If we have team crests/logos available, use those at a meaningfully
   larger size. If not, at minimum make the team-color treatment bigger and more
   prominent than the current small dot.

4. **Keep any supporting text minimal and restrained** — plain text, no extra
   icons or decoration, similar to the clean two-column goal-scorer list in the
   reference (right-aligned minute markers, no icon clutter). We may not need
   this exact pattern now, but keep it in mind if we ever add more match detail
   (goal scorers, key moments) later.

## Scope

This is specifically about the Full Time / final score section of the fixture
detail page. Don't change the "Your Call" / "The Model" prediction cards or the
season totals section in this pass — those can stay as they are for now, this
is a focused change to how the final score itself is presented.
