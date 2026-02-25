"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { sampleDomesticFixtures } from "@/data/sampleDomesticFixtures";
import { trackUmamiEvent } from "@/lib/umami";

type FixtureView = "current" | "last";

interface FixtureTeam {
  teamName: string;
  teamLogo: string;
  leagueFlag: string;
}

interface DomesticFixturesCardProps {
  teams: FixtureTeam[];
}

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vienna",
    day: "2-digit",
    month: "short",
  }).format(date);
};

const parseDate = (dateValue: string) => {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatWeekRange = (dates: Date[]) => {
  if (dates.length === 0) {
    return "TBD";
  }

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const start = formatDate(sorted[0].toISOString());
  const end = formatDate(sorted[sorted.length - 1].toISOString());
  return `${start} - ${end}`;
};

export function DomesticFixturesCard({ teams }: DomesticFixturesCardProps) {
  const [view, setView] = useState<FixtureView>("current");

  const handleViewChange = (nextView: FixtureView) => {
    setView((currentView) => {
      if (currentView !== nextView) {
        trackUmamiEvent("domestic_fixtures_view_change", { view: nextView });
      }
      return nextView;
    });
  };

  const weekRanges = useMemo(() => {
    const currentDates: Date[] = [];
    const lastDates: Date[] = [];

    teams.forEach((team) => {
      const sample = sampleDomesticFixtures[team.teamName];
      if (!sample) return;

      const currentDate = parseDate(sample.currentWeek.date);
      if (currentDate) currentDates.push(currentDate);

      const lastDate = parseDate(sample.lastWeek.date);
      if (lastDate) lastDates.push(lastDate);
    });

    return {
      current: formatWeekRange(currentDates),
      last: formatWeekRange(lastDates),
    };
  }, [teams]);

  const rows = useMemo(
    () =>
      teams.map((team) => {
        const sample = sampleDomesticFixtures[team.teamName];
        const fixture = sample ? sample[view === "current" ? "currentWeek" : "lastWeek"] : null;

        return {
          ...team,
          fixture,
        };
      }),
    [teams, view],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Domestic Games This Week</h2>
          <p className="text-xs text-slate-400">Sample data for now. Toggle current fixtures or last week results.</p>
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1 text-xs">
          <button
            type="button"
            onClick={() => handleViewChange("current")}
            className={`rounded-md px-2 py-1 ${
              view === "current" ? "bg-sky-500/20 text-sky-100" : "text-slate-300"
            }`}
          >
            Current ({weekRanges.current})
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("last")}
            className={`rounded-md px-2 py-1 ${
              view === "last" ? "bg-sky-500/20 text-sky-100" : "text-slate-300"
            }`}
          >
            Last ({weekRanges.last})
          </button>
        </div>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.teamName} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2">
              <Image src={row.leagueFlag} alt={row.teamName} width={14} height={14} className="h-3.5 w-3.5 rounded-full" />
              <Image src={row.teamLogo} alt={row.teamName} width={20} height={20} className="h-5 w-5 rounded-full" />
              <p className="truncate text-sm text-white">{row.teamName}</p>
            </div>

            {row.fixture ? (
              <div className="space-y-1 text-xs text-slate-300">
                <p>
                  {row.fixture.venue === "home" ? "vs" : "at"} {row.fixture.opponent}
                </p>
                <p className="text-slate-400">
                  {formatDate(row.fixture.date)} • {row.fixture.kickoff} (Vienna)
                </p>
                {view === "last" ? (
                  <p className="font-medium text-emerald-200">{row.fixture.result ?? "Result TBD"}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Fixture TBD</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
