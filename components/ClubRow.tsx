import { ClubStanding } from "@/types/club";
import { ClubAvatar } from "@/components/ClubAvatar";

interface ClubRowProps {
  club: ClubStanding;
  rank: number;
}

const statusClass: Record<ClubStanding["status"], string> = {
  Leader: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  Contender: "bg-sky-400/15 text-sky-200 border-sky-300/30",
  Out: "bg-rose-400/15 text-rose-200 border-rose-300/30"
};

export function ClubRow({ club, rank }: ClubRowProps) {
  return (
    <tr className="border-b border-white/5 text-sm text-slate-200 transition hover:bg-white/5">
      <td className="px-4 py-3 text-slate-400">#{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ClubAvatar name={club.name} />
          <div>
            <p className="font-medium text-white">{club.name}</p>
            <p className="text-xs text-slate-400">
              {club.country} • {club.league}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">#{club.leaguePosition}</td>
      <td className="px-4 py-3">{club.points}</td>
      <td className="px-4 py-3">{club.matchesPlayed}</td>
      <td className="px-4 py-3">{club.gapToFirst}</td>
      <td className="px-4 py-3">{club.gapToSecond}</td>
      <td className="px-4 py-3">{club.coefficient.toFixed(1)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusClass[club.status]}`}>
          {club.status}
        </span>
      </td>
    </tr>
  );
}
