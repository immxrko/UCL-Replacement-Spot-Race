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

const API_BASE_URL = getEnvOrDefault("API_BASE_URL", "https://v3.football.api-sports.io");
const API_FOOTBALL_HOST = getEnvOrDefault("API_FOOTBALL_HOST", new URL(API_BASE_URL).host);
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const SEASON = parsePositiveInt("SEASON", getEnvOrDefault("SEASON", "2025"));
const OUTPUT_DIR = getEnvOrDefault("OUTPUT_DIR", "data");
const OUTPUT_FILE = getEnvOrDefault("DOMESTIC_FIXTURES_OUTPUT_FILE", "domestic-fixtures.json");
const FIXTURES_TIMEZONE = getEnvOrDefault("DOMESTIC_FIXTURES_TIMEZONE", "Europe/Vienna");

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

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

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

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const getUtcWeekWindows = () => {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayIndexMondayBased = (todayUtc.getUTCDay() + 6) % 7;

  const currentWeekStart = new Date(todayUtc);
  currentWeekStart.setUTCDate(todayUtc.getUTCDate() - dayIndexMondayBased);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setUTCDate(currentWeekStart.getUTCDate() + 6);

  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 7);

  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setUTCDate(lastWeekStart.getUTCDate() + 6);

  return {
    now,
    currentWeekStart,
    currentWeekEnd,
    lastWeekStart,
    lastWeekEnd,
  };
};

const formatKickoffTime = (isoDateValue) => {
  const date = new Date(isoDateValue);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: FIXTURES_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const getFixtureDate = (fixture) => {
  const date = new Date(fixture?.fixture?.date ?? "");
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildResultLabel = (fixture, teamId) => {
  const statusShort = fixture?.fixture?.status?.short ?? null;
  if (!FINISHED_STATUSES.has(statusShort)) {
    return null;
  }

  const homeId = fixture?.teams?.home?.id ?? null;
  const awayId = fixture?.teams?.away?.id ?? null;
  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;

  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) {
    return null;
  }

  const teamIsHome = homeId === teamId;
  const teamIsAway = awayId === teamId;
  if (!teamIsHome && !teamIsAway) {
    return null;
  }

  const teamGoals = teamIsHome ? homeGoals : awayGoals;
  const opponentGoals = teamIsHome ? awayGoals : homeGoals;
  const outcome = teamGoals > opponentGoals ? "W" : teamGoals < opponentGoals ? "L" : "D";
  return `${teamGoals}-${opponentGoals} ${outcome}`;
};

const mapFixtureForTeam = (fixture, teamId) => {
  const homeTeam = fixture?.teams?.home;
  const awayTeam = fixture?.teams?.away;
  const teamIsHome = homeTeam?.id === teamId;
  const teamIsAway = awayTeam?.id === teamId;
  if (!teamIsHome && !teamIsAway) {
    return null;
  }

  const opponent = teamIsHome ? awayTeam : homeTeam;

  return {
    fixtureId: fixture?.fixture?.id ?? null,
    opponent: opponent?.name ?? "TBD",
    opponentLogo: opponent?.logo ?? null,
    date: fixture?.fixture?.date ?? null,
    kickoff: formatKickoffTime(fixture?.fixture?.date ?? ""),
    venue: teamIsHome ? "home" : "away",
    result: buildResultLabel(fixture, teamId),
    statusShort: fixture?.fixture?.status?.short ?? null,
    statusLong: fixture?.fixture?.status?.long ?? null,
  };
};

const isFixtureInWindow = (fixtureDate, windowStart, windowEnd) => {
  if (!fixtureDate) return false;
  const start = new Date(windowStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(windowEnd);
  end.setUTCHours(23, 59, 59, 999);
  return fixtureDate >= start && fixtureDate <= end;
};

const pickCurrentWeekFixture = ({ fixtures, teamId, now, currentWeekStart, currentWeekEnd }) => {
  const candidates = fixtures
    .map((fixture) => ({
      fixture,
      fixtureDate: getFixtureDate(fixture),
    }))
    .filter(
      ({ fixtureDate, fixture }) =>
        isFixtureInWindow(fixtureDate, currentWeekStart, currentWeekEnd) &&
        (fixture?.teams?.home?.id === teamId || fixture?.teams?.away?.id === teamId),
    )
    .sort((a, b) => a.fixtureDate.getTime() - b.fixtureDate.getTime());

  if (candidates.length === 0) {
    return null;
  }

  const upcoming = candidates.find(({ fixtureDate }) => fixtureDate >= now);
  if (upcoming) {
    return mapFixtureForTeam(upcoming.fixture, teamId);
  }

  const latestPlayed = candidates[candidates.length - 1];
  return mapFixtureForTeam(latestPlayed.fixture, teamId);
};

const pickLastWeekFixture = ({ fixtures, teamId, lastWeekStart, lastWeekEnd }) => {
  const candidates = fixtures
    .map((fixture) => ({
      fixture,
      fixtureDate: getFixtureDate(fixture),
    }))
    .filter(
      ({ fixtureDate, fixture }) =>
        isFixtureInWindow(fixtureDate, lastWeekStart, lastWeekEnd) &&
        (fixture?.teams?.home?.id === teamId || fixture?.teams?.away?.id === teamId),
    )
    .sort((a, b) => a.fixtureDate.getTime() - b.fixtureDate.getTime());

  if (candidates.length === 0) {
    return null;
  }

  return mapFixtureForTeam(candidates[candidates.length - 1].fixture, teamId);
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

const fetchFixturesForLeague = async ({ leagueId, fromDate, toDate }) => {
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
  const raceSnapshot = await fetchRaceSnapshot();
  const raceEntries = raceSnapshot.race;

  const windows = getUtcWeekWindows();
  const allFrom = toIsoDate(windows.lastWeekStart);
  const allTo = toIsoDate(windows.currentWeekEnd);
  const currentFrom = toIsoDate(windows.currentWeekStart);
  const currentTo = toIsoDate(windows.currentWeekEnd);
  const lastFrom = toIsoDate(windows.lastWeekStart);
  const lastTo = toIsoDate(windows.lastWeekEnd);

  const leagueIds = [...new Set(raceEntries.map((entry) => entry.leagueId))];
  const fixturesByLeague = new Map(
    await Promise.all(
      leagueIds.map(async (leagueId) => [
        leagueId,
        await fetchFixturesForLeague({
          leagueId,
          fromDate: allFrom,
          toDate: allTo,
        }),
      ]),
    ),
  );

  const teams = {};
  let currentWeekResolved = 0;
  let lastWeekResolved = 0;

  for (const entry of raceEntries) {
    const leagueFixtures = fixturesByLeague.get(entry.leagueId) ?? [];
    const currentWeek = pickCurrentWeekFixture({
      fixtures: leagueFixtures,
      teamId: entry.teamId,
      now: windows.now,
      currentWeekStart: windows.currentWeekStart,
      currentWeekEnd: windows.currentWeekEnd,
    });
    const lastWeek = pickLastWeekFixture({
      fixtures: leagueFixtures,
      teamId: entry.teamId,
      lastWeekStart: windows.lastWeekStart,
      lastWeekEnd: windows.lastWeekEnd,
    });

    if (currentWeek) currentWeekResolved += 1;
    if (lastWeek) lastWeekResolved += 1;

    teams[entry.teamName] = {
      currentWeek,
      lastWeek,
    };
  }

  const payload = {
    generatedAt,
    source: {
      endpoint: `${API_BASE_URL}/fixtures`,
      raceSnapshotUrl: RACE_URL,
      season: SEASON,
      timezone: FIXTURES_TIMEZONE,
      leaguesFetched: leagueIds.length,
    },
    windows: {
      currentWeek: { from: currentFrom, to: currentTo },
      lastWeek: { from: lastFrom, to: lastTo },
    },
    coverage: {
      trackedTeams: raceEntries.length,
      currentWeekResolved,
      lastWeekResolved,
    },
    teams,
  };

  const outputPath = join(OUTPUT_DIR, OUTPUT_FILE);
  await writeJson(outputPath, payload);

  console.log(`Saved domestic fixtures snapshot to ${outputPath}`);
  console.log(`Coverage: current=${currentWeekResolved}/${raceEntries.length}, last=${lastWeekResolved}/${raceEntries.length}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
