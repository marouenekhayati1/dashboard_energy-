# Instructions for AI coding agents

Before changing this repository, follow these instructions.

## First read

1. `README.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/FILE_STRUCTURE.md`
4. Read `docs/DATABASE_SCHEMA.md` only when a change involves Supabase data, policies, migrations, or database functions.
5. Read `docs/AI_WORKFLOW.md` for the recommended change and verification process.

## Minimize unnecessary code reading

- Do not reread the entire repository for a small, localized change.
- Start with the target file and the directly related HTML, CSS, caller/callee, and database schema.
- Search for references to a function, DOM ID, CSS class, database table, or column before changing its contract.
- Expand the scope only when references show a real dependency or when the change is cross-cutting.
- Never assume the documentation is complete or newer than the code. Check the relevant files in the current branch before relying on documented details.
- If a change reveals an undocumented dependency, update the relevant documentation in the same task.

## Safe change rules

- Confirm the target branch before writing. Do not modify other branches unless the request explicitly asks for them.
- Keep changes focused and avoid unrelated refactoring.
- Preserve existing behavior unless the user explicitly asks to change it.
- For `dashboard.html`, preserve script load order and verify that every DOM ID used by a module exists.
- For sortable/filterable tables, check header IDs, column keys, empty states, row actions, and combined filters.
- For Supabase changes, inspect all relevant queries and migration policies. Do not infer the remote schema solely from local migrations.
- Never expose service-role keys, passwords, tokens, or server secrets in frontend code or documentation.
- Do not claim tests, browser checks, or remote database checks were run unless they were actually run.
- Before finishing, summarize files changed, branches changed, commit IDs, and any checks not performed.

## Verification expectations

At minimum, inspect the diff or refetch the updated file to confirm the write succeeded. Run available syntax/build checks when practical. For UI changes, explicitly state whether a real browser test was performed. For database changes, explicitly state whether the migration was executed against a real database.

## Current project-specific cautions

- The app uses plain HTML/CSS/JavaScript and Supabase.
- `js/config.js` creates the shared browser client as `window.db`.
- `js/checklist-engine.js` must be loaded before `js/checklists.js`.
- `dashboard.html` loads both `js/history.js` and `js/history-v2.js`; understand the view and functions involved before changing either.
- `js/auth.js` stores an application session in browser `localStorage`. This is client-side state, not by itself a security boundary. Authorization must be enforced by server-side/database policies and trusted server functions.
