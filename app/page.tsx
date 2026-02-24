import Link from "next/link";
import { buildDataUrl } from "@/lib/dataBranch";
import { RaceSnapshot } from "@/types/standings";

const formatSigned = (value: number) => {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
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
            Updated: {snapshot.generatedAt} • Season: {snapshot.season}
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
                <div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-sky-200">{league.leagueName}</h2>
                  <p className="text-xs text-slate-400">{league.leagueCountry}</p>
                </div>
                <span className="rounded-full border border-sky-300/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-200">
                  Top 5
                </span>
              </div>

              <div className="space-y-1">
                {league.top5.map((row) => (
                  <div
                    key={row.teamId}
                    className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md px-2 py-1 text-sm ${
                      row.isHighlighted ? "bg-emerald-400/15 text-emerald-100" : "text-slate-200"
                    }`}
                  >
                    <span className="w-6 text-slate-400">#{row.rank}</span>
                    <span className="truncate">{row.teamName}</span>
                    <span>{row.points}</span>
                  </div>
                ))}
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
                  <th className="px-4 py-3">Pts</th>
                  <th className="px-4 py-3">Gap to 1st</th>
                  <th className="px-4 py-3">Delta</th>
                  <th className="px-4 py-3">Compared With</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.race.map((entry) => (
                  <tr key={`${entry.leagueId}-${entry.teamId}`} className="border-t border-white/5 text-sm">
                    <td className="px-4 py-3 text-white">{entry.teamName}</td>
                    <td className="px-4 py-3 text-slate-300">{entry.leagueName}</td>
                    <td className="px-4 py-3 text-slate-300">#{entry.rank}</td>
                    <td className="px-4 py-3 text-slate-300">{entry.points}</td>
                    <td className="px-4 py-3 text-slate-300">{entry.pointsToFirst}</td>
                    <td className="px-4 py-3 text-slate-300">{formatSigned(entry.pointsDeltaToComparison)}</td>
                    <td className="px-4 py-3 text-slate-300">{entry.comparisonTeamName ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
