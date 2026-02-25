export interface SampleFixture {
  opponent: string;
  date: string;
  kickoff: string;
  venue: "home" | "away";
  result?: string;
}

export interface TeamSampleFixtures {
  currentWeek: SampleFixture;
  lastWeek: SampleFixture;
}

export const sampleDomesticFixtures: Record<string, TeamSampleFixtures> = {
  "Olympiakos Piraeus": {
    currentWeek: { opponent: "Asteras Tripolis", date: "2026-02-28", kickoff: "19:30", venue: "home" },
    lastWeek: { opponent: "Aris", date: "2026-02-21", kickoff: "19:00", venue: "away", result: "2-1 W" },
  },
  PAOK: {
    currentWeek: { opponent: "Panserraikos", date: "2026-03-01", kickoff: "18:00", venue: "home" },
    lastWeek: { opponent: "OFI", date: "2026-02-22", kickoff: "17:00", venue: "away", result: "1-1 D" },
  },
  Rangers: {
    currentWeek: { opponent: "Kilmarnock", date: "2026-02-28", kickoff: "16:00", venue: "home" },
    lastWeek: { opponent: "Hearts", date: "2026-02-22", kickoff: "15:00", venue: "away", result: "0-1 L" },
  },
  Celtic: {
    currentWeek: { opponent: "Motherwell", date: "2026-03-01", kickoff: "13:30", venue: "away" },
    lastWeek: { opponent: "Aberdeen", date: "2026-02-22", kickoff: "14:00", venue: "home", result: "3-0 W" },
  },
  "FC Copenhagen": {
    currentWeek: { opponent: "Brondby", date: "2026-03-01", kickoff: "17:00", venue: "home" },
    lastWeek: { opponent: "Randers", date: "2026-02-23", kickoff: "18:00", venue: "away", result: "2-2 D" },
  },
  "FC Midtjylland": {
    currentWeek: { opponent: "Aalborg", date: "2026-02-28", kickoff: "18:30", venue: "away" },
    lastWeek: { opponent: "Silkeborg", date: "2026-02-22", kickoff: "16:00", venue: "home", result: "1-0 W" },
  },
  "Shakhtar Donetsk": {
    currentWeek: { opponent: "Dnipro-1", date: "2026-03-01", kickoff: "14:00", venue: "home" },
    lastWeek: { opponent: "Kryvbas", date: "2026-02-23", kickoff: "13:00", venue: "away", result: "2-0 W" },
  },
  "Ferencvarosi TC": {
    currentWeek: { opponent: "Debrecen", date: "2026-02-28", kickoff: "19:45", venue: "home" },
    lastWeek: { opponent: "Puskas Akademia", date: "2026-02-21", kickoff: "18:30", venue: "away", result: "1-1 D" },
  },
  "FK Crvena Zvezda": {
    currentWeek: { opponent: "Novi Pazar", date: "2026-03-01", kickoff: "17:00", venue: "away" },
    lastWeek: { opponent: "Vojvodina", date: "2026-02-22", kickoff: "16:30", venue: "home", result: "2-0 W" },
  },
  "Dinamo Zagreb": {
    currentWeek: { opponent: "Istra 1961", date: "2026-03-01", kickoff: "18:15", venue: "home" },
    lastWeek: { opponent: "Rijeka", date: "2026-02-22", kickoff: "17:30", venue: "away", result: "1-1 D" },
  },
  "Red Bull Salzburg": {
    currentWeek: { opponent: "LASK", date: "2026-02-28", kickoff: "18:00", venue: "away" },
    lastWeek: { opponent: "Sturm Graz", date: "2026-02-22", kickoff: "17:00", venue: "home", result: "0-2 L" },
  },
  "Slovan Bratislava": {
    currentWeek: { opponent: "Trnava", date: "2026-03-01", kickoff: "15:30", venue: "home" },
    lastWeek: { opponent: "DAC 1904", date: "2026-02-22", kickoff: "15:00", venue: "away", result: "2-1 W" },
  },
};
