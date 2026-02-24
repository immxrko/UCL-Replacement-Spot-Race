export type ClubStatus = "Leader" | "Contender" | "Out";

export interface ClubStanding {
  id: string;
  name: string;
  country: string;
  league: string;
  leaguePosition: number;
  points: number;
  matchesPlayed: number;
  gapToFirst: number;
  gapToSecond: number;
  coefficient: number;
  status: ClubStatus;
}

export type SortMode = "coefficient" | "pointsGap" | "leaguePosition";
export type FilterMode = "all" | "contenders" | "out";
