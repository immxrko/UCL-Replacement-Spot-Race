import { ClubStanding } from "@/types/club";
import { ClubAvatar } from "@/components/ClubAvatar";

interface ClubCardProps {
  club: ClubStanding;
  rank: number;
}

const statusClass: Record<ClubStanding["status"], string> = {
  Leader: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  Contender: "bg-sky-400/15 text-sky-200 border-sky-300/30",
  Out: "bg-rose-400/15 text-rose-200 border-rose-300/30"
};

export function ClubCard({ club, rank }: ClubCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ClubAvatar name={club.name} />
          <div>
            <p className="font-semibold text-white">
              #{rank} {club.name}
            </p>
            <p className="text-xs text-slate-400">
              {club.country} • {club.league}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs ${statusClass[club.status]}`}>{club.status}</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm text-slate-200">
        <div><dt className="text-xs text-slate-400">Pos</dt><dd>#{club.leaguePosition}</dd></div>
        <div><dt className="text-xs text-slate-400">Points</dt><dd>{club.points}</dd></div>
        <div><dt className="text-xs text-slate-400">Games</dt><dd>{club.matchesPlayed}</dd></div>
        <div><dt className="text-xs text-slate-400">Coeff.</dt><dd>{club.coefficient.toFixed(1)}</dd></div>
        <div><dt className="text-xs text-slate-400">Gap 1st</dt><dd>{club.gapToFirst}</dd></div>
        <div><dt className="text-xs text-slate-400">Gap 2nd</dt><dd>{club.gapToSecond}</dd></div>
      </dl>
    </article>
  );
}
