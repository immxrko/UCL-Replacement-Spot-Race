import { FilterMode, SortMode } from "@/types/club";

interface ControlsProps {
  search: string;
  filter: FilterMode;
  sort: SortMode;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: FilterMode) => void;
  onSortChange: (value: SortMode) => void;
}

export function Controls({
  search,
  filter,
  sort,
  onSearchChange,
  onFilterChange,
  onSortChange
}: ControlsProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl sm:grid-cols-3">
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Search Club</span>
        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/30"
          placeholder="Type a club, league or country..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Sort</span>
        <select
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/60"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortMode)}
        >
          <option value="coefficient">Coefficient</option>
          <option value="pointsGap">Points gap (to 1st)</option>
          <option value="leaguePosition">League position</option>
        </select>
      </label>

      <div className="sm:col-span-3">
        <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Filter</span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All", value: "all" },
            { label: "Contenders", value: "contenders" },
            { label: "Out", value: "out" }
          ].map((item) => {
            const isActive = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onFilterChange(item.value as FilterMode)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "border-sky-300/40 bg-sky-400/20 text-sky-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
