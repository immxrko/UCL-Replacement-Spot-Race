"use client";

import { useMemo, useState } from "react";
import { Controls } from "@/components/Controls";
import { HeroCard } from "@/components/HeroCard";
import { RankingTable } from "@/components/RankingTable";
import { mockClubs } from "@/data/mockClubs";
import { ClubStanding, FilterMode, SortMode } from "@/types/club";

const sorters: Record<SortMode, (a: ClubStanding, b: ClubStanding) => number> = {
  coefficient: (a, b) => b.coefficient - a.coefficient,
  pointsGap: (a, b) => b.gapToFirst - a.gapToFirst,
  leaguePosition: (a, b) => a.leaguePosition - b.leaguePosition
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("coefficient");

  const visibleClubs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mockClubs
      .filter((club) => {
        if (filter === "contenders") {
          return club.status === "Leader" || club.status === "Contender";
        }

        if (filter === "out") {
          return club.status === "Out";
        }

        return true;
      })
      .filter((club) => {
        if (!query) {
          return true;
        }

        return [club.name, club.country, club.league].some((value) =>
          value.toLowerCase().includes(query)
        );
      })
      .sort(sorters[sort]);
  }, [search, filter, sort]);

  const leader = visibleClubs[0] ?? mockClubs[0];

  return (
    <main className="min-h-screen bg-hero-grad px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live mock dashboard</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">UCL Replacement Spot Race</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Real-time style projection of which club currently earns the replacement entry slot, based on
            domestic context and UEFA club coefficient strength.
          </p>
        </header>

        <HeroCard club={leader} />

        <Controls
          search={search}
          filter={filter}
          sort={sort}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSortChange={setSort}
        />

        <RankingTable clubs={visibleClubs} />
      </div>
    </main>
  );
}
