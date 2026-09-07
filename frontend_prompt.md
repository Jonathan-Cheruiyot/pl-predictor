Let's build the React/TypeScript frontend for PL Predictor. Read PROJECT_BRIEF.md
first if you need a refresher on the backend/API shape.

## Scope for this pass

Build the core loop only, end to end:
1. Fixture list page — pull from GET /fixtures
2. Prediction form — submit a scoreline via POST /fixtures/{id}/user-prediction
3. Model reveal — after submitting, call GET /fixtures/{id}/model-prediction and
   show both predictions side by side
4. Leaderboard page — GET /leaderboard, simple table

I'll seed a handful of real upcoming PL fixtures manually for now — don't build
live fixture ingestion yet, that's a later phase.

## Design direction

This should look like a designer built it, not a default Tailwind/shadcn dashboard.
Specifically:
- Dark mode by default, clean and editorial rather than boxy/corporate
- Team identity should feel present — crests or team colors somewhere, not just
  plain text team names
- The "model reveal" moment (step 3 above) is the emotional core of the app —
  make that transition feel considered, not just two numbers appearing. A brief
  animation or visual reveal here is worth the effort; everywhere else can be
  simpler.
- Avoid generic AI-app tells: no generic hero gradients, no cookie-cutter card
  grids with icon+title+description repeated three times, no stock "dashboard"
  layout with a sidebar for a 4-page app this size.

## Stack

React + TypeScript + Tailwind, calling the FastAPI backend already running on
localhost:8000. Keep it a single reasonably-organized app, not over-engineered
with unnecessary state management libraries for this scope.

## What NOT to do yet

- No auth/login system — single hardcoded username is fine for now
- No styling pass on error/loading states beyond basic handling — get the core
  loop working and readable first
- No deployment config — that's a separate step later

Once this works end to end locally, we'll do a dedicated polish pass.
