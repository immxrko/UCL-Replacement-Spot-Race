# UCL Replacement Spot Race

## Daily standings/results sync

This project includes a daily sync job that fetches:
- standings from `GET /standings`
- results from `GET /fixtures` (filtered to finished fixtures)

It writes data into MongoDB collections:
- `standings_snapshots`
- `results_snapshots`
- `standings_latest`
- `results_latest`

### Run locally

1. Start MongoDB:
```bash
docker compose up -d
```

2. Create env file:
```bash
cp .env.example .env
```

3. Run sync job:
```bash
export $(grep -v '^#' .env | xargs)
npm run sync:data
```

Mongo Express is available at `http://localhost:8081`.

### GitHub Actions

Workflow file: `.github/workflows/sync-standings-results.yml`

Schedule: `59 23 * * *` (23:59 UTC daily)

Set repository secrets:
- `API_FOOTBALL_KEY`
- `MONGODB_URI`

Optional repository variables:
- `MONGODB_DB`

To change league/season/result filters, edit workflow env values:
- `LEAGUE_ID`
- `SEASON`
- `RESULTS_LIMIT`
- `RESULTS_STATUS`
