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
  teamId: number;
  teamName: string;
  teamLogo: string;
  rank: number;
  points: number;
  played: number;
  goalsDiff: number;
  pointsToFirst: number;
  pointsDeltaToComparison: number;
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
  leagues: RaceLeagueSummary[];
  race: RaceEntry[];
}
