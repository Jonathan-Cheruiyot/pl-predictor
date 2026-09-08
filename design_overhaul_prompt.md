# Design overhaul: break the uniform layout + adopt an FPL-inspired palette

Two changes, both needed together — new color direction, and breaking the
current uniform/generic layout structure.

## Part 1: Color palette — FPL/Premier League inspired

Move away from the current neutral dark-gray theme toward the official
Premier League / Fantasy Premier League brand palette:

- **Base background:** deep purple, `#38003C` (this is the actual PL brand
  purple) — replaces the current plain dark gray/black background
- **Accent 1 (primary actions, highlights):** hot pink/magenta, `#E90052`
- **Accent 2 (secondary highlights, links, active states):** electric cyan,
  `#04F5FF`
- **Accent 3 (positive/success states — wins, leading, correct predictions):**
  neon green, `#00FF85`
- **Text:** white/off-white on the purple base for primary text, muted
  lavender-gray for secondary text (avoid pure gray, which reads as generic
  dark-mode — tint it slightly purple to match the base)

Use these with restraint — the purple base does most of the work, pink/cyan/
green should be used as sparing accent moments (an active nav link, a "you're
leading" indicator, a call-to-action), not applied everywhere at once. Do NOT
use official Premier League or FPL logos, wordmarks, or trademarked assets —
just the color language.

## Part 2: Break the uniform, "every element identical" layout

Current problem, concretely: every fixture card is the same size/spacing
repeated down the page, every table row is styled identically, everything is
centered with even padding throughout. This reads as a generic AI-generated
layout. Fix this on the League Table page first (most uniform of the three
pages currently):

- **Give the top 4-6 teams a distinct, larger visual treatment** — bigger
  crests, more breathing room — while the rest of the table stays compact/
  dense below them. Uneven emphasis instead of one row style repeated 20 times.
- **Add one deliberately oversized typographic element to the page** — not
  decorative, functional. E.g. the league leader's team name or crest
  rendered at a dramatically larger scale than anything else on the page,
  similar to how "2026" or the trophy dominates the Immortals reference.
- **Break perfect center-symmetry** — shift the table layout off-center with
  an asymmetric margin (more space on one side than the other) rather than a
  centered grid. It should look intentionally composed/edited, not evenly
  distributed by default.

Once the League Table page reflects this, we'll apply the same principles
(uneven emphasis, one oversized element, asymmetric layout) to the Fixtures
and Leaderboard pages in a follow-up pass — don't do all three pages at once.

## Scope

Do the color palette across the whole app in this pass (it's a global change).
For the layout/hierarchy changes, League Table page only for now.
