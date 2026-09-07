# Roadmap: League Table, Teams, and Scope Decisions (LOCKED)

Final decisions, not options to revisit. Made to avoid building on paid
subscriptions, scraped data, or licensed press photography.

## Direct answers to the 3 open questions

1. **League table source:** football-data.org, not our own database. Our DB
   only has manually-seeded matches we've predicted on — nowhere near a full
   20-team season, so a table computed from it would be incomplete and wrong.
   football-data.org's free tier (10 req/min, free forever) reliably covers
   Premier League fixtures/results/standings — accurate enough for this,
   unlike TheSportsDB's crowd-sourced data.

2. **Crests source:** TheSportsDB. Crowd-sourced accuracy concerns don't
   really apply to logos the way they do to standings data, and it's simple
   to query with no strict rate limit for basic lookups. This is what
   TheSportsDB is actually good for — use it for this, not for standings.

3. **Rosters — where they surface:** a dedicated team page, reached by
   clicking a team row in the league table. Shows crest, name, and roster
   (names + numbers) below. Not duplicated into the fixture/prediction views
   — keep those focused on the two teams playing, not full squads.

## Cut entirely — not part of this project

- **Market value** — only real source is Transfermarkt, no public API,
  scraping violates their ToS. No legitimate substitute. Not building this.
- **Real squad/celebration photos** — licensed press photography (Getty/AP),
  no free API provides this. Not building this. Crests carry visual identity.
- **Player injury/availability status** — only on paid API tiers, and needs
  to stay fresh to be trustworthy. Not worth the maintenance burden. Not
  building this.
- **Live score updates** — real, but a dedicated infrastructure project on
  its own (polling/websockets, real-time frontend state). Not part of this
  build. Not on the roadmap unless revisited later for other reasons.

## Building — final scope, in order

1. **Score/prediction card redesign** (`score_redesign_prompt.md`) — Immortals-
   inspired score typography and layout. No new data needed. Do this first.
2. **League table** — from football-data.org's standings endpoint (see Q1
   above). Real, current Premier League table.
3. **Team crests** — from TheSportsDB (see Q2 above), fetched once and
   cached, not polled live.
4. **Basic rosters (names + numbers only)** — same source as crests,
   surfaced on a dedicated team page (see Q3 above). No status, no value,
   no injury data.

That's the full scope. Once these four are done, the project is
feature-complete for portfolio purposes — further additions are a deliberate
future decision, not a default expectation.
