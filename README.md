# UCL Replacement Spot Race

## Data flow

The app reads standings from a dedicated `data` branch file:
- `data/standings.json`

GitHub Actions updates that file every day at `23:59 UTC` and on manual dispatch.

The snapshot includes:
- full league table
- focus team (`FK Crvena Zvezda` by default)
- comparison logic:
  - if focus team is 1st, compare to 2nd (points clear)
  - otherwise compare to 1st (points behind)

## Workflow

Workflow file:
- `.github/workflows/sync-standings-results.yml`

Required repository secret:
- `API_FOOTBALL_KEY`

Optional repository variable:
- `FOCUS_TEAM_NAME` (default: `FK Crvena Zvezda`)

Branch/file target (in workflow env):
- `DATA_BRANCH` (default: `data`)
- `DATA_FILE_PATH` (default: `data/standings.json`)

## Manual workflow test

1. Push latest workflow + script changes to your default branch.
2. In GitHub: `Actions` -> `Sync Standings And Results` -> `Run workflow`.
3. Confirm the run creates/updates branch `data`.
4. Open `data/standings.json` in that branch and verify `analysis.summary` + `focusTeam`.

## Local run

1. Copy env file:
```bash
cp .env.example .env
```

2. Export env values and generate snapshot:
```bash
export $(grep -v '^#' .env | xargs)
npm run sync:data
```

This writes `data/standings.json` locally.

## Frontend data source

The page fetches this raw GitHub URL at runtime:

`https://raw.githubusercontent.com/<DATA_REPO_OWNER>/<DATA_REPO_NAME>/<DATA_BRANCH>/<DATA_FILE_PATH>`

Set runtime env vars if needed:
- `DATA_REPO_OWNER`
- `DATA_REPO_NAME`
- `DATA_BRANCH`
- `DATA_FILE_PATH`
