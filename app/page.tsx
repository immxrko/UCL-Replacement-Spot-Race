import Image from "next/image";
import Link from "next/link";
import { buildDataUrl } from "@/lib/dataBranch";
import { RaceSnapshot } from "@/types/standings";

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

const formatShortViennaDate = (isoDate: string | null) => {
  if (!isoDate) {
    return "Date TBD";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vienna",
    day: "2-digit",
    month: "short",
  }).format(date);
};

const raceDataPath = "data/race.json";

const getRaceSnapshot = async (): Promise<RaceSnapshot> => {
  const url = buildDataUrl(raceDataPath);
  const response = await fetch(url, { next: { revalidate: 300 } });

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

  return (
    <main className="min-h-screen bg-hero-grad px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Data branch live snapshot</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">UCL Replacement Spot Race</h1>
          <p className="max-w-3xl text-sm text-slate-300">
            League snapshots for all tracked leagues with highlighted contenders. Click a league card for full
            table details.
          </p>
          <p className="text-xs text-slate-400">
            Updated (Vienna): {formatViennaTime(snapshot.generatedAt)} • Season: {snapshot.season}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.leagues.map((league) => (
            <Link
              key={league.leagueId}
              href={`/league/${league.leagueId}`}
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

              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Placeholder Fixtures</p>
                <div className="space-y-1">
                  {league.highlightedTeams.map((team) => {
                    const opponent =
                      league.top5.find((candidate) => candidate.teamId !== team.teamId) ?? team;
                    return (
                      <div
                        key={team.teamId}
                        className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs"
                      >
                        <span className="min-w-[64px] text-left text-slate-400">
                          {team.isActiveInEurope
                            ? formatShortViennaDate(team.europeNextFixtureDate)
                            : "Inactive"}
                        </span>
                        <div className="ml-auto flex items-center gap-2 text-slate-200">
                          {team.isActiveInEurope ? (
                            <>
                              <Image
                                src={team.teamLogo}
                                alt={team.teamName}
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded-full"
                              />
                              <span className="text-slate-300">#{team.rank}</span>
                              <span className="text-slate-500">-</span>
                              <Image
                                src={opponent.teamLogo}
                                alt={opponent.teamName}
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded-full"
                              />
                              <span className="text-slate-300">#{opponent.rank}</span>
                            </>
                          ) : (
                            <span className="max-w-[190px] truncate text-slate-400">
                              {team.europeStatusNote ?? "No active European fixture"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">Open full standings</p>
            </Link>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-semibold text-white">UCL Race Teams</h2>
            <p className="text-xs text-slate-400">
              Highlighted clubs only. Positive delta means points clear of comparison team.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Club</th>
                  <th className="px-4 py-3">League</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Coeff.</th>
                  <th className="px-4 py-3">Europe</th>
                  <th className="px-4 py-3">Delta</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.race.map((entry, index) => {
                  const leagueSummary = snapshot.leagues.find((league) => league.leagueId === entry.leagueId);
                  const leagueFlag = entry.leagueFlag || leagueSummary?.leagueFlag;
                  const leagueLogo = entry.leagueLogo || leagueSummary?.leagueLogo;
                  const isRaceLeader = index === 0;

                  return (
                    <tr
                      key={`${entry.leagueId}-${entry.teamId}`}
                      className={`border-t border-white/5 text-sm ${
                        isRaceLeader ? "bg-amber-400/15" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                          <Image
                            src={entry.teamLogo}
                            alt={entry.teamName}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full"
                          />
                          <span>{entry.teamName}</span>
                         
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
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
                          {leagueLogo ? (
                            <Image
                              src={leagueLogo}
                              alt={entry.leagueName}
                              width={16}
                              height={16}
                              className="h-4 w-4 rounded-full"
                            />
                          ) : null}
                          <span>{entry.leagueName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">#{entry.rank}</td>
                      <td className="px-4 py-3 text-slate-300">{formatCoefficient(entry.coefficient ?? 0)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                            entry.isActiveInEurope
                              ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
                              : "border-slate-400/30 bg-slate-500/20 text-slate-200"
                          }`}
                        >
                          {entry.isActiveInEurope ? "Active" : "Out"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{formatSigned(entry.pointsDeltaToComparison)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
