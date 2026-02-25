# UCL Replacement Spot Race

## Data model

GitHub Actions writes data into the `data` branch every day at `23:59 UTC`:
- `data/race.json` (aggregated snapshot for homepage)
- `data/leagues/<leagueId>.json` (full table per league)
- `data/coefficients.json` (UEFA top-100 coefficient snapshot from separate `Get Coeff` workflow)
- `data/domestic-fixtures.json` (weekly domestic fixtures/results snapshot for highlighted teams)

Tracked leagues:
- `197` Greece
- `179` Scotland
- `119` Denmark
- `333` Ukraine
- `271` Hungary
- `286` Serbia
- `210` Croatia
- `218` Austria
- `332` Slovakia

Tracked clubs:
- Olympiakos Piraeus
- Rangers
- FC Copenhagen
- Shakhtar Donetsk
- Ferencvarosi TC
- PAOK
- FK Crvena Zvezda
- Dinamo Zagreb
- FC Midtjylland
- Red Bull Salzburg
- Celtic
- Slovan Bratislava

## UI behavior

- Homepage loads `data/race.json` from the data branch.
- Shows top-5 snapshot card for each tracked league.
- Highlights tracked clubs inside those top-5 lists.
- Shows race table for all tracked clubs.
- Race table order: domestic leaders (`#1`) first, tie-break by coefficient; remaining clubs then sorted by coefficient.
- Clicking a league card opens `/league/<leagueId>` with full standings from `data/leagues/<leagueId>.json`.

## Workflow

Workflow file:
- `.github/workflows/sync-standings-results.yml`
- `.github/workflows/sync-domestic-fixtures.yml`

Required repository secret:
- `API_FOOTBALL_KEY`

Cron:
- `59 23 * * *` (23:59 UTC)
- `10 0 * * 1` (every Monday at 00:10 UTC, domestic fixtures snapshot)

Behavior:
1. Fetch standings for all 9 leagues.
2. Pull latest coefficients from `data/coefficients.json` (fallback to built-in values if unavailable).
3. Generate JSON snapshots.
4. Overwrite `data/` folder in branch `data`.
5. Commit only if content changed.

Domestic fixtures workflow behavior:
1. Load tracked teams from `data/race.json`.
2. Fetch domestic league fixtures via API-Football `/fixtures` for last+current week windows.
3. Build per-team current week fixture and last week result entries.
4. Write `data/domestic-fixtures.json` to `data` branch.

## Local generation

1. Copy env file:
```bash
cp .env.example .env
```

2. Export env vars and run generator:
```bash
export $(grep -v '^#' .env | xargs)
npm run sync:data
npm run sync:fixtures
```

This writes:
- `data/race.json`
- `data/leagues/*.json`
- `data/domestic-fixtures.json`

## Frontend data source

Preferred:
- `DATA_ROOT_URL` (full raw root URL to data branch)

Fallback assembly if `DATA_ROOT_URL` is not set:
- `DATA_REPO_OWNER`
- `DATA_REPO_NAME`
- `DATA_BRANCH`
