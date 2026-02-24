import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const requiredEnv = ["API_FOOTBALL_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

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

const normalizeName = (value) => value.trim().toLocaleLowerCase();

const API_BASE_URL = getEnvOrDefault("API_BASE_URL", "https://v3.football.api-sports.io");
const API_FOOTBALL_HOST = getEnvOrDefault("API_FOOTBALL_HOST", new URL(API_BASE_URL).host);
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = parsePositiveInt("LEAGUE_ID", getEnvOrDefault("LEAGUE_ID", "286"));
const SEASON = parsePositiveInt("SEASON", getEnvOrDefault("SEASON", "2025"));
const FOCUS_TEAM_NAME = getEnvOrDefault("FOCUS_TEAM_NAME", "FK Crvena Zvezda");
const OUTPUT_FILE = getEnvOrDefault("OUTPUT_FILE", "data/standings.json");

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

const fetchStandings = async () => {
  const url = createApiUrl("/standings", { league: LEAGUE_ID, season: SEASON });
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

  const payload = await response.json();
  const apiErrors = parseApiErrors(payload.errors);
  if (apiErrors.length > 0) {
    throw new Error(`API returned errors: ${apiErrors.join(", ")}`);
  }

  return payload;
};

const mapStanding = (entry) => ({
  rank: entry.rank,
  teamId: entry.team.id,
  teamName: entry.team.name,
  teamLogo: entry.team.logo,
  points: entry.points,
  played: entry.all?.played ?? 0,
  goalsDiff: entry.goalsDiff ?? 0,
  form: entry.form ?? null,
  updatedAt: entry.update ?? null,
});

const buildSummary = (focusTeam, leaderTeam, comparisonTeam) => {
  const focusIsFirst = focusTeam.rank === 1;

  if (!comparisonTeam) {
    return {
      focusIsFirst,
      pointsToFirst: Math.max(leaderTeam.points - focusTeam.points, 0),
      pointsDeltaToComparison: 0,
      summary: `${focusTeam.teamName} has no comparison team available.`,
    };
  }

  const delta = focusTeam.points - comparisonTeam.points;
  const pointsToFirst = Math.max(leaderTeam.points - focusTeam.points, 0);

  if (focusIsFirst) {
    return {
      focusIsFirst,
      pointsToFirst: 0,
      pointsDeltaToComparison: delta,
      summary: `${focusTeam.teamName} is clear by ${Math.abs(delta)} points over ${comparisonTeam.teamName}.`,
    };
  }

  return {
    focusIsFirst,
    pointsToFirst,
    pointsDeltaToComparison: delta,
    summary: `${focusTeam.teamName} is ${Math.abs(delta)} points behind ${comparisonTeam.teamName}.`,
  };
};

const run = async () => {
  const payload = await fetchStandings();
  const league = payload?.response?.[0]?.league;
  const standingsRaw = league?.standings?.[0];

  if (!league || !Array.isArray(standingsRaw) || standingsRaw.length === 0) {
    throw new Error("Unexpected API response: standings table is missing.");
  }

  const standings = standingsRaw.map(mapStanding).sort((a, b) => a.rank - b.rank);
  const focusTeam = standings.find(
    (entry) => normalizeName(entry.teamName) === normalizeName(FOCUS_TEAM_NAME),
  );

  if (!focusTeam) {
    const available = standings.map((entry) => entry.teamName).join(", ");
    throw new Error(
      `Focus team "${FOCUS_TEAM_NAME}" not found in standings. Available teams: ${available}`,
    );
  }

  const leaderTeam = standings[0];
  const secondTeam = standings[1] ?? null;
  const comparisonTeam = focusTeam.rank === 1 ? secondTeam : leaderTeam;
  const analysis = buildSummary(focusTeam, leaderTeam, comparisonTeam);

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      endpoint: `${API_BASE_URL}/standings`,
      leagueId: LEAGUE_ID,
      season: SEASON,
    },
    league: {
      id: league.id,
      name: league.name,
      country: league.country,
      logo: league.logo,
      flag: league.flag,
      season: league.season,
      updatedAt: standings[0]?.updatedAt ?? null,
    },
    focusTeamName: FOCUS_TEAM_NAME,
    focusTeam,
    leaderTeam,
    comparisonTeam,
    analysis,
    standings,
  };

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Standings snapshot saved to ${OUTPUT_FILE}`);
  console.log(output.analysis.summary);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
