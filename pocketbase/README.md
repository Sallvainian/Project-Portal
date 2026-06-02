# PocketBase backend

Self-contained backend for Project-Portal: a single binary that bundles a
SQLite database, an auto-generated REST/realtime API, and an admin UI.

**Version:** 0.39.0 (`darwin/arm64`)

## Status

⚠️ **Scaffolding only — not wired up yet.** The binary is in place and runs, but
no collections are defined and the frontend's data layer (`src/api/taskade.ts`)
still points at the Taskade API. Migrating the app's data onto PocketBase is the
next step, intentionally not started yet.

## Run it

```bash
npm run pb
# or, from this folder:
./pocketbase serve
```

On first `serve` it creates `pb_data/` (the SQLite database + file storage) and
prints two local URLs:

- Admin UI — `http://127.0.0.1:8090/_/` (create the admin account on first visit)
- REST API — `http://127.0.0.1:8090/api/`

## Not committed to git

The binary, the bundled `CHANGELOG.md`/`LICENSE.md`, and `pb_data/` are
`.gitignore`d (the binary is 30 MB and `darwin/arm64`-specific; `pb_data` is your
local database). To set this up on another machine, download the matching build
from https://github.com/pocketbase/pocketbase/releases and unzip it here.
