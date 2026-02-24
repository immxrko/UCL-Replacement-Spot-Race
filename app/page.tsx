import { StandingsSnapshot } from "@/types/standings";

const DATA_URL = process.env.DATA_URL;
const DATA_REPO_OWNER = process.env.DATA_REPO_OWNER ?? "immxrko";
const DATA_REPO_NAME = process.env.DATA_REPO_NAME ?? "UCL-Replacement-Spot-Race";
const DATA_BRANCH = process.env.DATA_BRANCH ?? "data";
const DATA_FILE_PATH = process.env.DATA_FILE_PATH ?? "data/standings.json";

const formatGap = (value: number) => {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
};

const getDataUrl = () =>
  DATA_URL ??
  `https://raw.githubusercontent.com/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/${DATA_BRANCH}/${DATA_FILE_PATH}`;

const getSnapshot = async (): Promise<StandingsSnapshot> => {
  const response = await fetch(getDataUrl(), { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error(`Failed to fetch data branch file: ${response.status}`);
  }
  const data = (await response.json()) as StandingsSnapshot;
  if (!data?.focusTeam || !Array.isArray(data?.standings)) {
    throw new Error("Invalid snapshot format.");
  }
  return data;
};

export default async function HomePage() {
  const dataUrl = getDataUrl();
  let snapshot: StandingsSnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await getSnapshot();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown data loading error.";
    loadError = `Could not load data branch snapshot. ${message}`;
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-hero-grad px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-rose-300/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">Data Branch Unavailable</h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>
          <p className="mt-3 text-xs text-slate-300">Expected file URL: {dataUrl}</p>
        </div>
      </main>
    );
  }

  const leader = snapshot.leaderTeam;
  const focus = snapshot.focusTeam;
  const comparison = snapshot.comparisonTeam;
  const deltaText = snapshot.analysis.focusIsFirst
    ? `${snapshot.analysis.pointsDeltaToComparison} clear`
    : `${snapshot.analysis.pointsToFirst} behind 1st`;

  return (
    <main className="min-h-screen bg-hero-grad px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Data branch live snapshot</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">UCL Replacement Spot Race</h1>
          <p className="max-w-3xl text-sm text-slate-300">{snapshot.analysis.summary}</p>
          <p className="text-xs text-slate-400">
            Source: {snapshot.league.name} ({snapshot.league.country}) • Updated: {snapshot.generatedAt}
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase text-slate-400">Focus Team</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{focus.teamName}</h2>
            <p className="mt-1 text-sm text-slate-300">
              Rank #{focus.rank} • {focus.points} pts
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase text-slate-400">Leader</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{leader.teamName}</h2>
            <p className="mt-1 text-sm text-slate-300">
              Rank #{leader.rank} • {leader.points} pts
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase text-slate-400">Gap</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{deltaText}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {comparison ? `Compared with ${comparison.teamName}` : "No comparison team available"}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg">
          <table className="w-full">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Pts</th>
                <th className="px-4 py-3">MP</th>
                <th className="px-4 py-3">GD</th>
                <th className="px-4 py-3">Gap to 1st</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.standings.map((row) => (
                <tr key={row.teamId} className="border-t border-white/5 text-sm text-slate-200">
                  <td className="px-4 py-3">{row.rank}</td>
                  <td className="px-4 py-3">{row.teamName}</td>
                  <td className="px-4 py-3">{row.points}</td>
                  <td className="px-4 py-3">{row.played}</td>
                  <td className="px-4 py-3">{formatGap(row.goalsDiff)}</td>
                  <td className="px-4 py-3">{formatGap(row.points - leader.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
