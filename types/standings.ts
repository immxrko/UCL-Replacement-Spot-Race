export interface StandingRow {
  rank: number;
  teamId: number;
  teamName: string;
  teamLogo: string;
  points: number;
  played: number;
  goalsDiff: number;
  form: string | null;
  updatedAt: string | null;
  isHighlighted: boolean;
  coefficient: number | null;
  isActiveInEurope: boolean | null;
  europeCompetition: string | null;
  europeStage: string | null;
  europeNextFixtureDate: string | null;
  europeNextFixtureLabel: string | null;
  europeStatusNote: string | null;
}

export interface HighlightedTeamRow extends StandingRow {
  focusIsFirst: boolean;
  pointsToFirst: number;
  pointsDeltaToComparison: number;
  comparisonTeamName: string | null;
  summary: string;
}

export interface LeagueSnapshot {
  generatedAt: string;
  source: {
    endpoint: string;
    leagueId: number;
    season: number;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    updatedAt: string | null;
  };
  highlightTeams: string[];
  top5: StandingRow[];
  highlightedTeams: HighlightedTeamRow[];
  standings: StandingRow[];
}

export interface RaceEntry {
  leagueId: number;
  leagueName: string;
  leagueCountry: string;
  leagueLogo: string;
  leagueFlag: string;
  teamId: number;
  teamName: string;
  teamLogo: string;
  rank: number;
  points: number;
  played: number;
  goalsDiff: number;
  pointsToFirst: number;
  pointsDeltaToComparison: number;
  coefficient: number;
  isActiveInEurope: boolean;
  europeCompetition: string | null;
  europeStage: string | null;
  europeNextFixtureDate: string | null;
  europeNextFixtureLabel: string | null;
  europeStatusNote: string | null;
  comparisonTeamName: string | null;
  focusIsFirst: boolean;
  summary: string;
}

export interface RaceLeagueSummary {
  leagueId: number;
  leagueName: string;
  leagueCountry: string;
  leagueLogo: string;
  leagueFlag: string;
  leagueUpdatedAt: string | null;
  filePath: string;
  top5: StandingRow[];
  highlightedTeams: HighlightedTeamRow[];
}

export interface RaceSnapshot {
  generatedAt: string;
  season: number;
  coefficients?: {
    source: string | null;
    generatedAt: string | null;
    matchedTeams: number;
    fallbackTeams: string[];
  };
  leagues: RaceLeagueSummary[];
  race: RaceEntry[];
}

export interface DomesticFixtureRow {
  fixtureId: number | null;
  opponent: string;
  opponentLogo: string | null;
  date: string | null;
  kickoff: string;
  venue: "home" | "away";
  result: string | null;
  statusShort: string | null;
  statusLong: string | null;
}

export interface TeamDomesticFixtures {
  currentWeek: DomesticFixtureRow | null;
  lastWeek: DomesticFixtureRow | null;
}

export interface DomesticFixturesSnapshot {
  generatedAt: string;
  source: {
    endpoint: string;
    raceSnapshotUrl: string;
    season: number;
    timezone: string;
    leaguesFetched: number;
  };
  windows: {
    currentWeek: {
      from: string;
      to: string;
    };
    lastWeek: {
      from: string;
      to: string;
    };
  };
  coverage: {
    trackedTeams: number;
    currentWeekResolved: number;
    lastWeekResolved: number;
  };
  teams: Record<string, TeamDomesticFixtures>;
}

export interface EuropeanActiveCompetitionSummary {
  leagueId: number;
  leagueName: string;
  leagueLogo: string | null;
  fixtures: number;
}

export interface EuropeanActiveTeamStatus {
  teamId: number;
  teamName: string;
  teamLogo: string;
  isActiveInEurope: boolean;
  competitions: Array<{
    leagueId: number;
    leagueName: string;
    leagueLogo: string | null;
  }>;
  nextFixtureDate: string | null;
  nextFixtureLabel: string | null;
  nextOpponentName: string | null;
  nextOpponentLogo: string | null;
  nextFixtures: Array<{
    fixtureId: number | null;
    leagueId: number;
    leagueName: string;
    leagueLogo: string | null;
    fixtureDate: string;
    fixtureLabel: string;
    opponentName: string | null;
    opponentLogo: string | null;
    venue: "home" | "away" | null;
  }>;
}

export interface EuropeanActiveSnapshot {
  generatedAt: string;
  source: {
    endpoint: string;
    raceSnapshotUrl: string;
    season: number;
    timezone: string;
    from: string;
    to: string;
    competitionIds: number[];
  };
  competitions: EuropeanActiveCompetitionSummary[];
  summary: {
    trackedTeams: number;
    activeTeams: number;
  };
  teams: EuropeanActiveTeamStatus[];
}
