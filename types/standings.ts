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
}

export interface StandingsSnapshot {
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
  focusTeamName: string;
  focusTeam: StandingRow;
  leaderTeam: StandingRow;
  comparisonTeam: StandingRow | null;
  analysis: {
    focusIsFirst: boolean;
    pointsToFirst: number;
    pointsDeltaToComparison: number;
    summary: string;
  };
  standings: StandingRow[];
}
