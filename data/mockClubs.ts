import { ClubStanding } from "@/types/club";

export const mockClubs: ClubStanding[] = [
  {
    id: "ars",
    name: "Arsenal",
    country: "England",
    league: "Premier League",
    leaguePosition: 3,
    points: 68,
    matchesPlayed: 30,
    gapToFirst: -5,
    gapToSecond: -2,
    coefficient: 88.2,
    status: "Leader"
  },
  {
    id: "atl",
    name: "Atlético Madrid",
    country: "Spain",
    league: "La Liga",
    leaguePosition: 4,
    points: 61,
    matchesPlayed: 30,
    gapToFirst: -11,
    gapToSecond: -5,
    coefficient: 84.6,
    status: "Contender"
  },
  {
    id: "mil",
    name: "AC Milan",
    country: "Italy",
    league: "Serie A",
    leaguePosition: 3,
    points: 60,
    matchesPlayed: 29,
    gapToFirst: -8,
    gapToSecond: -3,
    coefficient: 82.1,
    status: "Contender"
  },
  {
    id: "bvb",
    name: "Borussia Dortmund",
    country: "Germany",
    league: "Bundesliga",
    leaguePosition: 5,
    points: 52,
    matchesPlayed: 28,
    gapToFirst: -15,
    gapToSecond: -10,
    coefficient: 79.4,
    status: "Contender"
  },
  {
    id: "ben",
    name: "Benfica",
    country: "Portugal",
    league: "Liga Portugal",
    leaguePosition: 2,
    points: 65,
    matchesPlayed: 28,
    gapToFirst: -2,
    gapToSecond: 0,
    coefficient: 71.8,
    status: "Out"
  },
  {
    id: "lyo",
    name: "Lyon",
    country: "France",
    league: "Ligue 1",
    leaguePosition: 6,
    points: 47,
    matchesPlayed: 29,
    gapToFirst: -20,
    gapToSecond: -15,
    coefficient: 62.3,
    status: "Out"
  }
];
