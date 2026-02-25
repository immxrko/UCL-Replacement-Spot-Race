import Image from "next/image";
import { DomesticFixturesCard } from "@/components/DomesticFixturesCard";
import { TrackedLink } from "@/components/TrackedLink";
import { UclExplainerCard } from "@/components/UclExplainerCard";
import { buildDataUrl } from "@/lib/dataBranch";
import { RaceSnapshot } from "@/types/standings";

export const dynamic = "force-dynamic";

const formatSigned = (value: number) => {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
};

const formatCoefficient = (value: number) => value.toFixed(3);

const formatViennaTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vienna",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const COEFFICIENT_TIEBREAKER_ORDER = [
  "Olympiakos Piraeus",
  "Rangers",
  "FC Copenhagen",
  "Shakhtar Donetsk",
  "Ferencvarosi TC",
  "PAOK",
  "FK Crvena Zvezda",
  "Dinamo Zagreb",
  "FC Midtjylland",
  "Red Bull Salzburg",
  "Celtic",
  "Slovan Bratislava",
];

const CLUB_TIEBREAKER_INDEX = new Map(
  COEFFICIENT_TIEBREAKER_ORDER.map((teamName, index) => [teamName.toLocaleLowerCase(), index]),
);

const getClubTieBreaker = (teamName: string) =>
  CLUB_TIEBREAKER_INDEX.get(teamName.toLocaleLowerCase()) ?? Number.MAX_SAFE_INTEGER;

const raceDataPath = "data/race.json";

const getRaceSnapshot = async (): Promise<RaceSnapshot> => {
  const url = buildDataUrl(raceDataPath);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch race snapshot from ${url} (${response.status}).`);
  }

  const payload = (await response.json()) as RaceSnapshot;
  if (!Array.isArray(payload.leagues) || !Array.isArray(payload.race)) {
    throw new Error("Invalid race snapshot schema.");
  }

  return payload;
};

export default async function HomePage() {
  const expectedUrl = buildDataUrl(raceDataPath);
  let snapshot: RaceSnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await getRaceSnapshot();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown snapshot loading error.";
    loadError = message;
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-hero-grad px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-rose-300/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">Data Branch Unavailable</h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>
          <p className="mt-2 text-xs text-slate-300">Expected URL: {expectedUrl}</p>
        </div>
      </main>
    );
  }

  const raceByCoefficient = [...snapshot.race].sort((a, b) => {
    if (b.coefficient !== a.coefficient) {
      return b.coefficient - a.coefficient;
    }

    const tieA = getClubTieBreaker(a.teamName);
    const tieB = getClubTieBreaker(b.teamName);
    if (tieA !== tieB) {
      return tieA - tieB;
    }

    return a.teamName.localeCompare(b.teamName);
  });

  const bestDomesticLeader = [...raceByCoefficient]
    .filter((entry) => entry.rank === 1)
    .sort((a, b) => {
      if (b.coefficient !== a.coefficient) {
        return b.coefficient - a.coefficient;
      }

      const tieA = getClubTieBreaker(a.teamName);
      const tieB = getClubTieBreaker(b.teamName);
      if (tieA !== tieB) {
        return tieA - tieB;
      }

      return a.teamName.localeCompare(b.teamName);
    })[0] ?? raceByCoefficient[0];
  const bestDomesticLeaderKey = bestDomesticLeader
    ? `${bestDomesticLeader.leagueId}-${bestDomesticLeader.teamId}`
    : null;
  const fixtureTeams = raceByCoefficient.map((entry) => ({
    teamName: entry.teamName,
    teamLogo: entry.teamLogo,
    leagueFlag:
      entry.leagueFlag ||
      snapshot.leagues.find((league) => league.leagueId === entry.leagueId)?.leagueFlag ||
      entry.teamLogo,
  }));

  return (
    <main className="min-h-screen bg-hero-grad px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">UCL Replacement Spot Race</h1>
          <p className="max-w-3xl text-sm text-slate-300">
            UCL race table is sorted by coefficient. League snapshots are listed below.
          </p>
          <p className="text-xs text-slate-400">
            Updated (Vienna): {formatViennaTime(snapshot.generatedAt)} • Season: {snapshot.season}
          </p>
        </header>

        <UclExplainerCard />

        {bestDomesticLeader ? (
          <section className="sm:hidden rounded-2xl border border-amber-300/30 bg-amber-400/15 p-4">
            <p className="text-[11px] uppercase tracking-wide text-amber-100">Current Direct UCL Team</p>
            <div className="mt-2 flex items-center gap-3">
              <Image
                src={bestDomesticLeader.teamLogo}
                alt={bestDomesticLeader.teamName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{bestDomesticLeader.teamName}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-amber-100">
                  <Image
                    src={bestDomesticLeader.leagueFlag}
                    alt={bestDomesticLeader.leagueCountry}
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 rounded-full"
                  />
                  <span className="truncate">{bestDomesticLeader.leagueCountry}</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-amber-100">Direct UCL Entry next season</p>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-semibold text-white">UCL Replacement Spot Race Standings</h2>
            <p className="text-xs text-slate-400">
              Team shown with league flag + team logo. Coefficient is green when active and red when out.
            </p>
          </div>

          <div className="sm:hidden space-y-1 p-2">
            <div className="grid grid-cols-[minmax(0,1fr)_66px_44px_52px] items-center px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400">
              <span>Team</span>
              <span className="text-right">Coeff.</span>
              <span className="text-right">Rank</span>
              <span className="text-right">Delta</span>
            </div>
            {raceByCoefficient.map((entry) => {
              const leagueSummary = snapshot.leagues.find((league) => league.leagueId === entry.leagueId);
              const leagueFlag = entry.leagueFlag || leagueSummary?.leagueFlag;
              const rowKey = `${entry.leagueId}-${entry.teamId}`;
              const isBestDomesticLeader = rowKey === bestDomesticLeaderKey;

              return (
                <div
                  key={rowKey}
                  className={`rounded-lg border border-white/10 px-2 py-2 text-xs ${
                    isBestDomesticLeader ? "bg-amber-400/15" : "bg-white/[0.02]"
                  }`}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_66px_44px_52px] items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-white">
                      {leagueFlag ? (
                        <Image
                          src={leagueFlag}
                          alt={entry.leagueCountry}
                          width={14}
                          height={14}
                          className="h-3.5 w-3.5 rounded-full"
                        />
                      ) : null}
                      <Image
                        src={entry.teamLogo}
                        alt={entry.teamName}
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] rounded-full"
                      />
                      <span className="truncate">{entry.teamName}</span>
                    </div>
                    <span
                      className={`text-right tabular-nums ${
                        entry.isActiveInEurope ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {formatCoefficient(entry.coefficient ?? 0)}
                    </span>
                    <span className="text-right text-slate-300 tabular-nums">#{entry.rank}</span>
                    <span className="text-right text-slate-300 tabular-nums">
                      {formatSigned(entry.pointsDeltaToComparison)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[52%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3">Team</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3">Coeff.</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3">Rank</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3">Delta</th>
                </tr>
              </thead>
              <tbody>
                {raceByCoefficient.map((entry) => {
                  const leagueSummary = snapshot.leagues.find((league) => league.leagueId === entry.leagueId);
                  const leagueFlag = entry.leagueFlag || leagueSummary?.leagueFlag;
                  const rowKey = `${entry.leagueId}-${entry.teamId}`;
                  const isBestDomesticLeader = rowKey === bestDomesticLeaderKey;

                  return (
                    <tr
                      key={rowKey}
                      className={`border-t border-white/5 text-xs sm:text-sm ${isBestDomesticLeader ? "bg-amber-400/15" : ""}`}
                    >
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-white">
                        <div className="flex items-center gap-2">
                          {leagueFlag ? (
                            <Image
                              src={leagueFlag}
                              alt={entry.leagueCountry}
                              width={16}
                              height={16}
                              className="h-4 w-4 rounded-full"
                            />
                          ) : null}
                          <Image
                            src={entry.teamLogo}
                            alt={entry.teamName}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full"
                          />
                          <span className="truncate">{entry.teamName}</span>
                          {isBestDomesticLeader ? (
                            <span className="rounded-full border border-amber-300/40 bg-amber-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-100">
                              Direct UCL
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td
                        className={
                          entry.isActiveInEurope
                            ? "px-2 py-2 sm:px-4 sm:py-3 text-emerald-300"
                            : "px-2 py-2 sm:px-4 sm:py-3 text-rose-300"
                        }
                      >
                        {formatCoefficient(entry.coefficient ?? 0)}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-slate-300">#{entry.rank}</td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-slate-300">
                        {formatSigned(entry.pointsDeltaToComparison)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.leagues.map((league) => (
            <TrackedLink
              key={league.leagueId}
              href={`/league/${league.leagueId}`}
              eventName="open_league_snapshot"
              eventPayload={{ leagueId: league.leagueId, leagueName: league.leagueName }}
              className="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-sky-300/40 hover:bg-slate-900/80"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Image
                    src={league.leagueLogo}
                    alt={league.leagueName}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                  />
                  <Image
                    src={league.leagueFlag}
                    alt={league.leagueCountry}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-white group-hover:text-sky-200">{league.leagueName}</h2>
                    <p className="text-xs text-slate-400">{league.leagueCountry}</p>
                  </div>
                </div>
                <span className="rounded-full border border-sky-300/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-200">
                  Top 5
                </span>
              </div>

              <div className="space-y-1">
                {league.top5.map((row) => (
                  <div
                    key={row.teamId}
                    className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-md px-2 py-1 text-sm ${
                      row.isHighlighted ? "bg-emerald-400/15 text-emerald-100" : "text-slate-200"
                    }`}
                  >
                    <span className="w-6 text-slate-400">#{row.rank}</span>
                    <Image
                      src={row.teamLogo}
                      alt={row.teamName}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full"
                    />
                    <span className="truncate">{row.teamName}</span>
                    <span>{row.points}</span>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-400">Open full standings</p>
            </TrackedLink>
          ))}
        </section>

        <DomesticFixturesCard teams={fixtureTeams} />
      </div>
    </main>
  );
}
