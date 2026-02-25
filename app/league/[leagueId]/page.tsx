import Image from "next/image";
import { TrackedLink } from "@/components/TrackedLink";
import { buildDataUrl } from "@/lib/dataBranch";
import { LeagueSnapshot } from "@/types/standings";

export const dynamic = "force-dynamic";

interface LeaguePageProps {
  params: {
    leagueId: string;
  };
}

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

const getLeagueSnapshot = async (leagueId: string): Promise<LeagueSnapshot> => {
  const url = buildDataUrl(`data/leagues/${leagueId}.json`);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch league snapshot from ${url} (${response.status}).`);
  }

  const payload = (await response.json()) as LeagueSnapshot;
  if (!payload?.league || !Array.isArray(payload?.standings)) {
    throw new Error("Invalid league snapshot schema.");
  }

  return payload;
};

export default async function LeaguePage({ params }: LeaguePageProps) {
  const expectedUrl = buildDataUrl(`data/leagues/${params.leagueId}.json`);
  let snapshot: LeagueSnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await getLeagueSnapshot(params.leagueId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown snapshot loading error.";
    loadError = message;
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-hero-grad px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-rose-300/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">League Snapshot Unavailable</h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>
          <p className="mt-2 text-xs text-slate-300">Expected URL: {expectedUrl}</p>
          <TrackedLink
            href="/"
            eventName="back_to_all_leagues"
            eventPayload={{ source: "league_error_page", leagueId: params.leagueId }}
            className="mt-4 inline-block text-sm text-sky-200 hover:text-sky-100"
          >
            Back to all leagues
          </TrackedLink>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-hero-grad px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <TrackedLink
            href="/"
            eventName="back_to_all_leagues"
            eventPayload={{ source: "league_page", leagueId: params.leagueId }}
            className="text-xs uppercase tracking-[0.2em] text-sky-300 hover:text-sky-200"
          >
            Back to all leagues
          </TrackedLink>
          <div className="flex items-center gap-3">
            <Image
              src={snapshot.league.logo}
              alt={snapshot.league.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
            />
            <Image
              src={snapshot.league.flag}
              alt={snapshot.league.country}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full"
            />
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{snapshot.league.name}</h1>
          </div>
          <p className="text-sm text-slate-300">
            {snapshot.league.country} • Season {snapshot.league.season}
          </p>
          <p className="text-xs text-slate-400">Updated (Vienna): {formatViennaTime(snapshot.generatedAt)}</p>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          {snapshot.highlightedTeams.map((team) => (
            <article key={team.teamId} className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase text-emerald-200">Tracked Club</p>
              <div className="mt-1 flex items-center gap-2">
                <Image
                  src={team.teamLogo}
                  alt={team.teamName}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full"
                />
                <h2 className="text-lg font-semibold text-white">{team.teamName}</h2>
              </div>
              <p className="mt-1 text-sm text-slate-200">
                Rank #{team.rank} • {team.points} pts • Gap to first: {team.pointsToFirst}
              </p>
              <p className="mt-1 text-xs text-emerald-100">Coefficient: {formatCoefficient(team.coefficient ?? 0)}</p>
              <p className="mt-1 text-xs text-emerald-100">{team.summary}</p>
            </article>
          ))}
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
                <tr
                  key={row.teamId}
                  className={`border-t border-white/5 text-sm ${
                    row.isHighlighted ? "bg-emerald-400/10 text-emerald-100" : "text-slate-200"
                  }`}
                >
                  <td className="px-4 py-3">#{row.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src={row.teamLogo}
                        alt={row.teamName}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full"
                      />
                      <span>{row.teamName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.points}</td>
                  <td className="px-4 py-3">{row.played}</td>
                  <td className="px-4 py-3">{formatSigned(row.goalsDiff)}</td>
                  <td className="px-4 py-3">{snapshot.standings[0].points - row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
