# Remove the LLM match recap feature entirely

This feature was implemented from an earlier version of next_steps_combined.md
(Part 3) but is being reverted — decided not to use the Anthropic API for
this project due to ongoing cost. Remove everything related to it, cleanly.

## What to remove

- The recap endpoint (e.g. GET /fixtures/{id}/recap) from the backend
- Any new file created specifically for the LLM integration (e.g. a
  recap.py, llm.py, or similar module)
- The `anthropic` package from requirements.txt if it was added
- Any database column/table added to cache recaps (e.g. a `recap` column on
  the fixtures table) — if data has already been written to it, it's fine to
  drop the column/table since this is local dev data, not production data
- The ANTHROPIC_API_KEY reference from wherever it's loaded (should not be
  referenced anywhere in the codebase after this)
- The recap section on the frontend fixture detail page — remove the
  section entirely, don't leave an empty placeholder

## What to double check afterward

- Confirm nothing else references the removed code (no dangling imports,
  no broken calls to the removed endpoint from the frontend)
- Run the backend and frontend and confirm everything still builds/runs
  cleanly with no errors related to the removed feature
- Confirm .env no longer needs ANTHROPIC_API_KEY (fine if the line is still
  physically in the file unused, but nothing in the code should require it)

## Scope

Only remove what's specifically related to the LLM recap feature. Don't
touch anything else — the fixture detail page's existing sections (Your
Call / The Model, Full Time, Season Totals), the scoring logic, or any other
part of the app should be completely unaffected by this removal.
