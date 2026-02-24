import { ClubStanding } from "@/types/club";
import { ClubAvatar } from "@/components/ClubAvatar";

interface HeroCardProps {
  club: ClubStanding;
}

export function HeroCard({ club }: HeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl shadow-glow">
      <div className="absolute inset-0 bg-hero-grad opacity-80" />
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
            Currently gets the spot
          </span>
          <div className="flex items-center gap-3">
            <ClubAvatar name={club.name} />
            <div>
              <h2 className="text-2xl font-semibold text-white">{club.name}</h2>
              <p className="text-sm text-slate-300">
                {club.country} • {club.league}
              </p>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:min-w-64">
          <div>
            <dt className="text-slate-400">Coefficient</dt>
            <dd className="text-lg font-semibold text-white">{club.coefficient.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">League Position</dt>
            <dd className="text-lg font-semibold text-white">#{club.leaguePosition}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Gap to 1st</dt>
            <dd className="text-lg font-semibold text-white">{club.gapToFirst}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Matches</dt>
            <dd className="text-lg font-semibold text-white">{club.matchesPlayed}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
