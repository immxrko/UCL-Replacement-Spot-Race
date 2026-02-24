import { ClubStanding } from "@/types/club";
import { ClubRow } from "@/components/ClubRow";
import { ClubCard } from "@/components/ClubCard";

interface RankingTableProps {
  clubs: ClubStanding[];
}

export function RankingTable({ clubs }: RankingTableProps) {
  return (
    <section className="space-y-4">
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg md:block">
        <table className="w-full">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">League Pos</th>
              <th className="px-4 py-3">Pts</th>
              <th className="px-4 py-3">MP</th>
              <th className="px-4 py-3">Δ 1st</th>
              <th className="px-4 py-3">Δ 2nd</th>
              <th className="px-4 py-3">Coeff.</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club, index) => (
              <ClubRow key={club.id} club={club} rank={index + 1} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {clubs.map((club, index) => (
          <ClubCard key={club.id} club={club} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
