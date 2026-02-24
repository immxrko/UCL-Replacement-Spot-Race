import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const requiredEnv = ["API_FOOTBALL_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const TRACKED_LEAGUES = [
  {
    leagueId: 197,
    highlightTeams: [
      { name: "Olympiakos Piraeus", coefficient: 62.25 },
      { name: "PAOK", coefficient: 48.25 },
    ],
  },
  {
    leagueId: 179,
    highlightTeams: [
      { name: "Rangers", coefficient: 59.25 },
      { name: "Celtic", coefficient: 44.0 },
    ],
  },
  {
    leagueId: 119,
    highlightTeams: [
      { name: "FC Copenhagen", coefficient: 54.375 },
      { name: "FC Midtjylland", coefficient: 46.25 },
    ],
  },
  { leagueId: 333, highlightTeams: [{ name: "Shakhtar Donetsk", coefficient: 50.25 }] },
  { leagueId: 271, highlightTeams: [{ name: "Ferencvarosi TC", coefficient: 48.25 }] },
  { leagueId: 286, highlightTeams: [{ name: "FK Crvena Zvezda", coefficient: 46.5 }] },
  { leagueId: 210, highlightTeams: [{ name: "Dinamo Zagreb", coefficient: 46.5 }] },
  { leagueId: 218, highlightTeams: [{ name: "Red Bull Salzburg", coefficient: 45.0 }] },
  { leagueId: 332, highlightTeams: [{ name: "Slovan Bratislava", coefficient: 36.0 }] },
];

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
const SEASON = parsePositiveInt("SEASON", getEnvOrDefault("SEASON", "2025"));
const OUTPUT_DIR = getEnvOrDefault("OUTPUT_DIR", "data");

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

const fetchStandings = async (leagueId) => {
  const url = createApiUrl("/standings", { league: leagueId, season: SEASON });
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
    throw new Error(`API returned errors for league ${leagueId}: ${apiErrors.join(", ")}`);
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
  isHighlighted: false,
  coefficient: null,
});

const resolveHighlightedRows = (standings, highlightTeams) => {
  const usedTeamIds = new Set();
  const foundRows = [];
  const missingTeams = [];

  for (const teamConfig of highlightTeams) {
    const teamName = normalizeName(teamConfig.name);
    let match =
      standings.find(
        (row) => normalizeName(row.teamName) === teamName && !usedTeamIds.has(row.teamId),
      ) ??
      standings.find(
        (row) =>
          (normalizeName(row.teamName).includes(teamName) || teamName.includes(normalizeName(row.teamName))) &&
          !usedTeamIds.has(row.teamId),
      );

    if (!match) {
      missingTeams.push(teamConfig.name);
      continue;
    }

    usedTeamIds.add(match.teamId);
    foundRows.push({
      row: match,
      coefficient: teamConfig.coefficient,
    });
  }

  return { foundRows, missingTeams };
};

const buildTeamAnalysis = (team, leaderTeam, secondTeam) => {
  const focusIsFirst = team.rank === 1;
  const comparisonTeam = focusIsFirst ? secondTeam : leaderTeam;

  if (!comparisonTeam) {
    return {
      focusIsFirst,
      pointsToFirst: Math.max(leaderTeam.points - team.points, 0),
      pointsDeltaToComparison: 0,
      comparisonTeamName: null,
      summary: `${team.teamName} has no comparison team available.`,
    };
  }

  const delta = team.points - comparisonTeam.points;
  const pointsToFirst = Math.max(leaderTeam.points - team.points, 0);

  if (focusIsFirst) {
    return {
      focusIsFirst,
      pointsToFirst: 0,
      pointsDeltaToComparison: delta,
      comparisonTeamName: comparisonTeam.teamName,
      summary: `${team.teamName} is clear by ${Math.abs(delta)} points over ${comparisonTeam.teamName}.`,
    };
  }

  return {
    focusIsFirst,
    pointsToFirst,
    pointsDeltaToComparison: delta,
    comparisonTeamName: comparisonTeam.teamName,
    summary: `${team.teamName} is ${Math.abs(delta)} points behind ${comparisonTeam.teamName}.`,
  };
};

const createLeagueSnapshot = ({ leagueId, highlightTeams }, payload, generatedAt) => {
  const league = payload?.response?.[0]?.league;
  const standingsRaw = league?.standings?.[0];

  if (!league || !Array.isArray(standingsRaw) || standingsRaw.length === 0) {
    throw new Error(`Unexpected API response for league ${leagueId}: standings table is missing.`);
  }

  const standings = standingsRaw.map((entry) => mapStanding(entry)).sort((a, b) => a.rank - b.rank);
  const leaderTeam = standings[0];
  const secondTeam = standings[1] ?? null;

  const { foundRows: highlightedRows, missingTeams } = resolveHighlightedRows(standings, highlightTeams);
  if (missingTeams.length > 0) {
    console.warn(
      `Warning: missing highlighted teams in league ${leagueId}: ${missingTeams.join(", ")}`,
    );
  }

  if (highlightedRows.length === 0) {
    const available = standings.map((row) => row.teamName).join(", ");
    throw new Error(
      `None of highlighted teams found in league ${leagueId}. Wanted: ${highlightTeams
        .map((team) => team.name)
        .join(", ")}. Available: ${available}`,
    );
  }

  const highlightedTeamIds = new Set(highlightedRows.map((item) => item.row.teamId));
  const coefficientByTeamId = new Map(highlightedRows.map((item) => [item.row.teamId, item.coefficient]));
  const standingsWithHighlights = standings.map((row) => ({
    ...row,
    isHighlighted: highlightedTeamIds.has(row.teamId),
    coefficient: coefficientByTeamId.get(row.teamId) ?? null,
  }));
  const highlightedRowsWithFlag = standingsWithHighlights.filter((row) =>
    highlightedTeamIds.has(row.teamId),
  );

  const highlightedTeams = highlightedRowsWithFlag.map((row) => ({
    ...row,
    ...buildTeamAnalysis(row, leaderTeam, secondTeam),
  }));

  return {
    generatedAt,
    source: {
      endpoint: `${API_BASE_URL}/standings`,
      leagueId,
      season: SEASON,
    },
    league: {
      id: league.id,
      name: league.name,
      country: league.country,
      logo: league.logo,
      flag: league.flag,
      season: league.season,
      updatedAt: standingsWithHighlights[0]?.updatedAt ?? null,
    },
    highlightTeams: highlightTeams.map((team) => team.name),
    top5: standingsWithHighlights.slice(0, 5),
    highlightedTeams,
    standings: standingsWithHighlights,
  };
};

const writeJson = async (filePath, payload) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const run = async () => {
  const generatedAt = new Date().toISOString();
  const leaguePayloads = await Promise.all(
    TRACKED_LEAGUES.map(async (config) => ({
      config,
      payload: await fetchStandings(config.leagueId),
    })),
  );

  const leagueSnapshots = leaguePayloads.map(({ config, payload }) =>
    createLeagueSnapshot(config, payload, generatedAt),
  );

  const raceEntries = leagueSnapshots
    .flatMap((snapshot) =>
      snapshot.highlightedTeams.map((team) => ({
        leagueId: snapshot.league.id,
        leagueName: snapshot.league.name,
        leagueCountry: snapshot.league.country,
        leagueLogo: snapshot.league.logo,
        leagueFlag: snapshot.league.flag,
        teamId: team.teamId,
        teamName: team.teamName,
        teamLogo: team.teamLogo,
        rank: team.rank,
        points: team.points,
        played: team.played,
        goalsDiff: team.goalsDiff,
        pointsToFirst: team.pointsToFirst,
        pointsDeltaToComparison: team.pointsDeltaToComparison,
        comparisonTeamName: team.comparisonTeamName,
        focusIsFirst: team.focusIsFirst,
        coefficient: team.coefficient ?? 0,
        summary: team.summary,
      })),
    )
    .sort((a, b) => {
      const aIsLeader = a.rank === 1;
      const bIsLeader = b.rank === 1;

      if (aIsLeader !== bIsLeader) {
        return aIsLeader ? -1 : 1;
      }

      if (b.coefficient !== a.coefficient) {
        return b.coefficient - a.coefficient;
      }

      return a.teamName.localeCompare(b.teamName);
    });

  const raceSnapshot = {
    generatedAt,
    season: SEASON,
    leagues: leagueSnapshots.map((snapshot) => ({
      leagueId: snapshot.league.id,
      leagueName: snapshot.league.name,
      leagueCountry: snapshot.league.country,
      leagueLogo: snapshot.league.logo,
      leagueFlag: snapshot.league.flag,
      leagueUpdatedAt: snapshot.league.updatedAt,
      filePath: `data/leagues/${snapshot.league.id}.json`,
      top5: snapshot.top5,
      highlightedTeams: snapshot.highlightedTeams,
    })),
    race: raceEntries,
  };

  const leagueWrites = leagueSnapshots.map((snapshot) =>
    writeJson(join(OUTPUT_DIR, "leagues", `${snapshot.league.id}.json`), snapshot),
  );

  await Promise.all([
    ...leagueWrites,
    writeJson(join(OUTPUT_DIR, "race.json"), raceSnapshot),
  ]);

  console.log(`Saved race snapshot for ${leagueSnapshots.length} leagues into ${OUTPUT_DIR}`);
  console.log(`Tracked clubs in race table: ${raceEntries.length}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
