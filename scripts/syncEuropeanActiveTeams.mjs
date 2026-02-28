import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const requiredEnv = ["API_FOOTBALL_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const getEnvOrDefault = (key, fallback) => {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
};

const parsePositiveInt = (name, value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, received "${value}"`);
  }
  return parsed;
};

const parseCompetitionIds = (value) => {
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item) && item > 0);

  if (parsed.length === 0) {
    throw new Error(`EUROPE_ACTIVE_LEAGUE_IDS must contain at least one numeric id, received "${value}"`);
  }

  return [...new Set(parsed)];
};

const API_BASE_URL = getEnvOrDefault("API_BASE_URL", "https://v3.football.api-sports.io");
const API_FOOTBALL_HOST = getEnvOrDefault("API_FOOTBALL_HOST", new URL(API_BASE_URL).host);
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

const SEASON = parsePositiveInt("SEASON", getEnvOrDefault("SEASON", "2025"));
const OUTPUT_DIR = getEnvOrDefault("OUTPUT_DIR", "data");
const OUTPUT_FILE = getEnvOrDefault("EUROPE_ACTIVE_OUTPUT_FILE", "european-active-teams.json");
const COMPETITION_IDS = parseCompetitionIds(getEnvOrDefault("EUROPE_ACTIVE_LEAGUE_IDS", "2,3,848"));
const FIXTURES_TO_DATE = getEnvOrDefault("EUROPE_ACTIVE_TO_DATE", "2026-08-27");
const FIXTURES_TIMEZONE = getEnvOrDefault("EUROPE_ACTIVE_TIMEZONE", "UTC");

const DATA_REPO_OWNER = getEnvOrDefault("DATA_REPO_OWNER", "immxrko");
const DATA_REPO_NAME = getEnvOrDefault("DATA_REPO_NAME", "UCL-Replacement-Spot-Race");
const DATA_BRANCH = getEnvOrDefault("DATA_BRANCH", "data");
const DATA_ROOT_URL = getEnvOrDefault(
  "DATA_ROOT_URL",
  `https://raw.githubusercontent.com/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/refs/heads/${DATA_BRANCH}`,
);
const RACE_FILE_PATH = getEnvOrDefault("RACE_FILE_PATH", "data/race.json");
const RACE_URL = getEnvOrDefault(
  "RACE_URL",
  `${DATA_ROOT_URL.replace(/\/$/, "")}/${RACE_FILE_PATH.replace(/^\//, "")}`,
);

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"]);
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "INT", "SUSP"]);

const createApiUrl = (endpoint, query = {}) => {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(endpoint, base);

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

const normalizeName = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLocaleLowerCase();

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const parseFixtureDate = (fixture) => {
  const value = fixture?.fixture?.date ?? "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isFixtureStillActive = (fixtureDate, statusShort, now) => {
  if (LIVE_STATUSES.has(statusShort)) {
    return true;
  }

  if (FINISHED_STATUSES.has(statusShort)) {
    return false;
  }

  if (!fixtureDate) {
    return false;
  }

  return fixtureDate >= now;
};

const fetchRaceSnapshot = async () => {
  const response = await fetch(RACE_URL);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch race snapshot (${response.status}) from ${RACE_URL}: ${body}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.race)) {
    throw new Error(`Invalid race snapshot at ${RACE_URL}: race[] is missing.`);
  }

  return payload;
};

const fetchFixturesForCompetition = async ({ leagueId, fromDate, toDate }) => {
  const url = createApiUrl("/fixtures", {
    league: leagueId,
    season: SEASON,
    from: fromDate,
    to: toDate,
    timezone: FIXTURES_TIMEZONE,
  });

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
      "x-apisports-host": API_FOOTBALL_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API fixtures request failed (${response.status}) for ${url.toString()}: ${body}`);
  }

  const payload = await response.json();
  const apiErrors = parseApiErrors(payload.errors);
  if (apiErrors.length > 0) {
    throw new Error(`API returned fixture errors for league ${leagueId}: ${apiErrors.join(", ")}`);
  }

  return payload?.response ?? [];
};

const writeJson = async (filePath, payload) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const run = async () => {
  const generatedAt = new Date().toISOString();
  const now = new Date();
  const fromDate = toIsoDate(now);
  const toDate = FIXTURES_TO_DATE;

  const raceSnapshot = await fetchRaceSnapshot();
  const trackedRaceEntries = raceSnapshot.race;

  const trackedById = new Map();
  const trackedByName = new Map();
  for (const entry of trackedRaceEntries) {
    trackedById.set(entry.teamId, entry);
    trackedByName.set(normalizeName(entry.teamName), entry);
  }

  const competitionFixtures = await Promise.all(
    COMPETITION_IDS.map(async (leagueId) => ({
      leagueId,
      fixtures: await fetchFixturesForCompetition({ leagueId, fromDate, toDate }),
    })),
  );

  const competitionSummary = competitionFixtures.map(({ leagueId, fixtures }) => ({
    leagueId,
    leagueName: fixtures[0]?.league?.name ?? `League ${leagueId}`,
    fixtures: fixtures.length,
  }));

  const activeByTeamId = new Map();
  for (const entry of trackedRaceEntries) {
    activeByTeamId.set(entry.teamId, {
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamLogo: entry.teamLogo,
      isActiveInEurope: false,
      competitions: [],
      nextFixtureDate: null,
      nextFixtureLabel: null,
      nextOpponentName: null,
      nextOpponentLogo: null,
      nextFixtures: [],
    });
  }

  for (const { leagueId, fixtures } of competitionFixtures) {
    for (const fixture of fixtures) {
      const fixtureDate = parseFixtureDate(fixture);
      const statusShort = fixture?.fixture?.status?.short ?? "";
      const leagueName = fixture?.league?.name ?? `League ${leagueId}`;

      const home = fixture?.teams?.home;
      const away = fixture?.teams?.away;

      for (const teamSide of [home, away]) {
        if (!teamSide) continue;

        const trackedEntry =
          trackedById.get(teamSide.id) ??
          trackedByName.get(normalizeName(teamSide.name));

        if (!trackedEntry) {
          continue;
        }

        const status = activeByTeamId.get(trackedEntry.teamId);
        if (!status) {
          continue;
        }

        if (!status.competitions.some((item) => item.leagueId === leagueId)) {
          status.competitions.push({ leagueId, leagueName });
        }

        if (isFixtureStillActive(fixtureDate, statusShort, now)) {
          status.isActiveInEurope = true;
          const isTrackedTeamHome = home?.id === trackedEntry.teamId;
          const opponent = isTrackedTeamHome ? away : home;

          if (fixtureDate) {
            const existingIds = new Set(status.nextFixtures.map((item) => item.fixtureId));
            const fixtureId = fixture?.fixture?.id ?? null;
            if (!existingIds.has(fixtureId)) {
              status.nextFixtures.push({
                fixtureId,
                leagueId,
                leagueName,
                fixtureDate: fixtureDate.toISOString(),
                fixtureLabel: `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"}`,
                opponentName: opponent?.name ?? null,
                opponentLogo: opponent?.logo ?? null,
              });
            }
          }

          if (
            fixtureDate &&
            (!status.nextFixtureDate || fixtureDate < new Date(status.nextFixtureDate))
          ) {
            status.nextFixtureDate = fixtureDate.toISOString();
            status.nextFixtureLabel = `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"}`;
            status.nextOpponentName = opponent?.name ?? null;
            status.nextOpponentLogo = opponent?.logo ?? null;
          }
        }
      }
    }
  }

  const teams = [...activeByTeamId.values()]
    .map((team) => ({
      ...team,
      nextFixtures: team.nextFixtures
        .sort((a, b) => new Date(a.fixtureDate).getTime() - new Date(b.fixtureDate).getTime())
        .slice(0, 2),
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
  const activeTeams = teams.filter((team) => team.isActiveInEurope).length;

  const payload = {
    generatedAt,
    source: {
      endpoint: `${API_BASE_URL}/fixtures`,
      raceSnapshotUrl: RACE_URL,
      season: SEASON,
      timezone: FIXTURES_TIMEZONE,
      from: fromDate,
      to: toDate,
      competitionIds: COMPETITION_IDS,
    },
    competitions: competitionSummary,
    summary: {
      trackedTeams: teams.length,
      activeTeams,
    },
    teams,
  };

  const outputPath = join(OUTPUT_DIR, OUTPUT_FILE);
  await writeJson(outputPath, payload);

  console.log(`Saved european active teams snapshot to ${outputPath}`);
  console.log(`Coverage: active=${activeTeams}/${teams.length}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
