import { MongoClient } from "mongodb";

const requiredEnv = ["API_FOOTBALL_KEY", "MONGODB_URI"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const API_BASE_URL = process.env.API_BASE_URL ?? "https://v3.football.api-sports.io";
const API_FOOTBALL_HOST =
  process.env.API_FOOTBALL_HOST ?? new URL(API_BASE_URL).host;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const getEnvOrDefault = (key, fallback) => {
  const value = process.env[key];
  return value && value.trim() ? value : fallback;
};

const parsePositiveInt = (name, value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, received "${value}"`);
  }
  return parsed;
};

const MONGODB_DB = getEnvOrDefault("MONGODB_DB", "ucl_replacement_spot_race");
const LEAGUE_ID = parsePositiveInt("LEAGUE_ID", getEnvOrDefault("LEAGUE_ID", "286"));
const SEASON = parsePositiveInt(
  "SEASON",
  getEnvOrDefault("SEASON", String(new Date().getUTCFullYear())),
);
const RESULTS_LIMIT = parsePositiveInt(
  "RESULTS_LIMIT",
  getEnvOrDefault("RESULTS_LIMIT", "50"),
);
const RESULTS_STATUS = getEnvOrDefault("RESULTS_STATUS", "FT");

const createApiUrl = (endpoint, query = {}) => {
  const url = new URL(endpoint, API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
};

const parseApiErrors = (errors) => {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors.filter(Boolean).map(String);
  if (typeof errors === "object") {
    return Object.values(errors).filter(Boolean).map(String);
  }
  return [String(errors)];
};

const fetchApi = async (endpoint, query) => {
  const url = createApiUrl(endpoint, query);
  const response = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
      "x-apisports-host": API_FOOTBALL_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed (${response.status}) for ${url.toString()}: ${body}`);
  }

  const json = await response.json();
  const apiErrors = parseApiErrors(json.errors);
  if (apiErrors.length > 0) {
    throw new Error(`API returned errors for ${url.toString()}: ${apiErrors.join(", ")}`);
  }

  return json;
};

const buildMeta = (payload) => ({
  get: payload.get,
  parameters: payload.parameters,
  results: payload.results,
  paging: payload.paging,
});

const run = async () => {
  const fetchedAt = new Date();
  const snapshotDate = fetchedAt.toISOString().slice(0, 10);

  const [standingsPayload, fixturesPayload] = await Promise.all([
    fetchApi("/standings", { league: LEAGUE_ID, season: SEASON }),
    fetchApi("/fixtures", {
      league: LEAGUE_ID,
      season: SEASON,
      status: RESULTS_STATUS,
      last: RESULTS_LIMIT,
    }),
  ]);

  const standings =
    standingsPayload?.response?.[0]?.league?.standings?.[0] ?? [];
  const fixtures = Array.isArray(fixturesPayload?.response)
    ? fixturesPayload.response
    : [];

  const standingsSnapshot = {
    leagueId: LEAGUE_ID,
    season: SEASON,
    fetchedAt,
    snapshotDate,
    standings,
    standingsCount: standings.length,
    apiMeta: buildMeta(standingsPayload),
  };

  const resultsSnapshot = {
    leagueId: LEAGUE_ID,
    season: SEASON,
    fetchedAt,
    snapshotDate,
    status: RESULTS_STATUS,
    limit: RESULTS_LIMIT,
    results: fixtures,
    resultsCount: fixtures.length,
    apiMeta: buildMeta(fixturesPayload),
  };

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();

    const db = client.db(MONGODB_DB);
    const standingsSnapshots = db.collection("standings_snapshots");
    const resultsSnapshots = db.collection("results_snapshots");
    const standingsLatest = db.collection("standings_latest");
    const resultsLatest = db.collection("results_latest");

    await Promise.all([
      standingsSnapshots.createIndex({ leagueId: 1, season: 1, fetchedAt: -1 }),
      resultsSnapshots.createIndex({ leagueId: 1, season: 1, fetchedAt: -1 }),
      standingsLatest.createIndex({ leagueId: 1, season: 1 }, { unique: true }),
      resultsLatest.createIndex({ leagueId: 1, season: 1 }, { unique: true }),
    ]);

    const [standingsInsert, resultsInsert] = await Promise.all([
      standingsSnapshots.insertOne(standingsSnapshot),
      resultsSnapshots.insertOne(resultsSnapshot),
    ]);

    await Promise.all([
      standingsLatest.updateOne(
        { leagueId: LEAGUE_ID, season: SEASON },
        {
          $set: {
            ...standingsSnapshot,
            snapshotId: standingsInsert.insertedId,
            updatedAt: fetchedAt,
          },
        },
        { upsert: true },
      ),
      resultsLatest.updateOne(
        { leagueId: LEAGUE_ID, season: SEASON },
        {
          $set: {
            ...resultsSnapshot,
            snapshotId: resultsInsert.insertedId,
            updatedAt: fetchedAt,
          },
        },
        { upsert: true },
      ),
    ]);

    console.log(
      `Synced league=${LEAGUE_ID} season=${SEASON} at ${fetchedAt.toISOString()} (${standings.length} standings rows, ${fixtures.length} results).`,
    );
  } finally {
    await client.close();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
