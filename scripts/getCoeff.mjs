import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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

const DEFAULT_YEAR = new Date().getUTCFullYear();

const SEASON_YEAR = parsePositiveInt(
  "UEFA_RANKINGS_YEAR",
  getEnvOrDefault("UEFA_RANKINGS_YEAR", String(DEFAULT_YEAR)),
);
const TOP_LIMIT = parsePositiveInt("UEFA_COEFF_LIMIT", getEnvOrDefault("UEFA_COEFF_LIMIT", "100"));
const PAGE_SIZE = parsePositiveInt("UEFA_COEFF_PAGE_SIZE", getEnvOrDefault("UEFA_COEFF_PAGE_SIZE", "50"));
const LANGUAGE = getEnvOrDefault("UEFA_LANGUAGE", "DE").toUpperCase();
const OUTPUT_DIR = getEnvOrDefault("OUTPUT_DIR", "data");
const OUTPUT_FILE = getEnvOrDefault("UEFA_COEFF_OUTPUT_FILE", "coefficients.json");
const RANKINGS_PAGE_URL = getEnvOrDefault(
  "UEFA_RANKINGS_PAGE_URL",
  `https://de.uefa.com/nationalassociations/uefarankings/club/?year=${SEASON_YEAR}`,
);

const REQUEST_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; UCL-Replacement-Spot-Race/1.0; +https://github.com/immxrko/UCL-Replacement-Spot-Race)",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const normalizeBaseUrl = (value) => (value.endsWith("/") ? value : `${value}/`);

const extractWindowValue = (html, key) => {
  const regex = new RegExp(`window\\.${key}\\s*=\\s*'([^']+)'`);
  const match = html.match(regex);
  return match?.[1] ?? null;
};

const resolveApiConfig = async () => {
  const overriddenApiKey = getEnvOrDefault("UEFA_API_KEY", "");
  const overriddenCompApiUrl = getEnvOrDefault("UEFA_COMP_API_URL", "");

  if (overriddenApiKey && overriddenCompApiUrl) {
    return {
      apiKey: overriddenApiKey,
      compApiUrl: normalizeBaseUrl(overriddenCompApiUrl),
      configSource: "env",
    };
  }

  const pageResponse = await fetch(RANKINGS_PAGE_URL, {
    headers: REQUEST_HEADERS,
  });

  if (!pageResponse.ok) {
    const body = await pageResponse.text();
    throw new Error(
      `Failed to fetch UEFA rankings page (${pageResponse.status}) from ${RANKINGS_PAGE_URL}: ${body.slice(
        0,
        500,
      )}`,
    );
  }

  const html = await pageResponse.text();
  const extractedApiKey = extractWindowValue(html, "apiKey");
  const extractedCompApiUrl = extractWindowValue(html, "compApiUrl");

  const apiKey = overriddenApiKey || extractedApiKey;
  const compApiUrl = overriddenCompApiUrl || extractedCompApiUrl;

  if (!apiKey || !compApiUrl) {
    throw new Error(
      "Could not resolve UEFA API config from ranking page. Set UEFA_API_KEY and UEFA_COMP_API_URL explicitly.",
    );
  }

  return {
    apiKey,
    compApiUrl: normalizeBaseUrl(compApiUrl),
    configSource: overriddenApiKey || overriddenCompApiUrl ? "mixed" : "scraped",
  };
};

const fetchCoefficientsPage = async ({ apiKey, compApiUrl, page }) => {
  const url = new URL("v2/coefficients", compApiUrl);
  url.searchParams.set("coefficientRange", "OVERALL");
  url.searchParams.set("coefficientType", "MEN_CLUB");
  url.searchParams.set("seasonYear", String(SEASON_YEAR));
  url.searchParams.set("page", String(page));
  url.searchParams.set("pagesize", String(PAGE_SIZE));
  url.searchParams.set("language", LANGUAGE);

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
      "user-agent": REQUEST_HEADERS["user-agent"],
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to fetch coefficients page ${page} (${response.status}) from ${url.toString()}: ${body.slice(
        0,
        500,
      )}`,
    );
  }

  const payload = await response.json();
  const members = payload?.data?.members;
  if (!Array.isArray(members)) {
    throw new Error(`Unexpected coefficients payload for page ${page}: members array is missing.`);
  }

  return {
    members,
    lastUpdateDate: payload?.data?.lastUpdateDate ?? null,
    totalElements: Number.parseInt(payload?.meta?.collection?.totalElements ?? "", 10) || null,
    requestUrl: url.toString(),
  };
};

const mapClub = (entry, fallbackRank) => {
  const member = entry?.member ?? {};
  const overall = entry?.overallRanking ?? {};
  const competition = entry?.competition ?? {};

  return {
    rank: Number.isFinite(overall.position) ? overall.position : fallbackRank,
    teamId: member.id ?? null,
    teamName: member.displayName ?? member.internationalName ?? null,
    teamOfficialName: member.displayOfficialName ?? null,
    teamCode: member.teamCode ?? member.displayTeamCode ?? null,
    countryCode: member.countryCode ?? null,
    countryName: member.countryName ?? null,
    teamLogo: member.logoUrl ?? null,
    teamLogoMedium: member.mediumLogoUrl ?? null,
    teamLogoLarge: member.bigLogoUrl ?? null,
    associationId: member.associationId ?? null,
    associationLogo: member.associationLogoUrl ?? null,
    competitionId: competition.id ?? null,
    competitionName: competition.displayName ?? null,
    competitionType: competition.type ?? null,
    coefficient: overall.totalPoints ?? null,
    nationalAssociationCoefficient: overall.nationalAssociationPoints ?? null,
    trend: overall.trend ?? null,
    baseSeasonYear: overall.baseSeasonYear ?? null,
    targetSeasonYear: overall.targetSeasonYear ?? null,
  };
};

const writeJson = async (filePath, payload) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const run = async () => {
  const generatedAt = new Date().toISOString();
  const { apiKey, compApiUrl, configSource } = await resolveApiConfig();

  const collected = [];
  let lastUpdateDate = null;
  let totalAvailable = null;
  let page = 1;
  let lastRequestUrl = null;

  while (collected.length < TOP_LIMIT && page <= 10) {
    const pageResult = await fetchCoefficientsPage({ apiKey, compApiUrl, page });
    lastUpdateDate = pageResult.lastUpdateDate ?? lastUpdateDate;
    totalAvailable = pageResult.totalElements ?? totalAvailable;
    lastRequestUrl = pageResult.requestUrl;

    if (pageResult.members.length === 0) {
      break;
    }

    collected.push(...pageResult.members);

    if (pageResult.members.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  const clubs = collected
    .map((entry, index) => mapClub(entry, index + 1))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, TOP_LIMIT);

  if (clubs.length === 0) {
    throw new Error("No coefficient clubs fetched from UEFA endpoint.");
  }

  const payload = {
    generatedAt,
    source: {
      rankingsPageUrl: RANKINGS_PAGE_URL,
      endpoint: `${compApiUrl}v2/coefficients`,
      lastRequestUrl,
      configSource,
      seasonYear: SEASON_YEAR,
      coefficientRange: "OVERALL",
      coefficientType: "MEN_CLUB",
      language: LANGUAGE,
      pageSize: PAGE_SIZE,
      requestedLimit: TOP_LIMIT,
      totalAvailable,
      fetched: clubs.length,
      lastUpdateDate,
    },
    clubs,
  };

  const outputFilePath = join(OUTPUT_DIR, OUTPUT_FILE);
  await writeJson(outputFilePath, payload);

  console.log(`Saved UEFA coefficients top ${clubs.length} to ${outputFilePath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
