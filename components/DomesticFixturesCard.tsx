"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { sampleDomesticFixtures } from "@/data/sampleDomesticFixtures";
import { trackUmamiEvent } from "@/lib/umami";
import { DomesticFixturesSnapshot } from "@/types/standings";

type FixtureView = "current" | "last";

interface FixtureTeam {
  teamName: string;
  teamLogo: string;
  leagueName: string;
  leagueFlag: string;
}

interface DomesticFixturesCardProps {
  teams: FixtureTeam[];
  snapshot?: DomesticFixturesSnapshot | null;
}

interface DisplayFixture {
  opponent: string;
  opponentLogo: string | null;
  date: string | null;
  kickoff: string;
  venue: "home" | "away";
  result: string | null;
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

const getResultClassName = (result: string | null | undefined) => {
  if (!result) return "text-slate-300";

  const normalized = result.trim().toUpperCase();
  if (normalized.endsWith("W")) return "text-emerald-200";
  if (normalized.endsWith("D")) return "text-amber-200";
  if (normalized.endsWith("L")) return "text-rose-200";
  return "text-slate-300";
};

const getResultScore = (result: string | null | undefined) => {
  if (!result) return null;
  const token = result.trim().split(/\s+/)[0];
  if (!token) return null;
  return token.includes("-") ? token : null;
};

const getOpponentInitials = (name: string) => {
  const words = name
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export function DomesticFixturesCard({ teams, snapshot }: DomesticFixturesCardProps) {
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
    if (snapshot?.windows) {
      return {
        current: `${formatDate(snapshot.windows.currentWeek.from)} - ${formatDate(snapshot.windows.currentWeek.to)}`,
        last: `${formatDate(snapshot.windows.lastWeek.from)} - ${formatDate(snapshot.windows.lastWeek.to)}`,
      };
    }

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
  }, [snapshot, teams]);

  const rows = useMemo(
    () =>
      teams.map((team) => {
        const liveTeamData = snapshot?.teams?.[team.teamName] ?? null;
        const fixtureFromLive = liveTeamData ? liveTeamData[view === "current" ? "currentWeek" : "lastWeek"] : null;
        const sample = sampleDomesticFixtures[team.teamName];
        const fixtureFromSample = sample ? sample[view === "current" ? "currentWeek" : "lastWeek"] : null;
        const fixture: DisplayFixture | null = fixtureFromLive
          ? {
              opponent: fixtureFromLive.opponent,
              opponentLogo: fixtureFromLive.opponentLogo ?? null,
              date: fixtureFromLive.date ?? null,
              kickoff: fixtureFromLive.kickoff ?? "TBD",
              venue: fixtureFromLive.venue,
              result: fixtureFromLive.result ?? null,
            }
          : fixtureFromSample
            ? {
                opponent: fixtureFromSample.opponent,
                opponentLogo: null,
                date: fixtureFromSample.date ?? null,
                kickoff: fixtureFromSample.kickoff ?? "TBD",
                venue: fixtureFromSample.venue,
                result: fixtureFromSample.result ?? null,
              }
            : null;

        return {
          ...team,
          fixture,
        };
      }),
    [snapshot, teams, view],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-[0_12px_40px_-24px_rgba(14,165,233,0.6)] backdrop-blur-lg">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-sky-950/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Domestic Games</h2>
          <p className="text-xs text-slate-400">
            {snapshot ? "Live domestic league fixtures/results for Teams that are in race for the spot." : "Sample fallback data."}
          </p>
        </div>
        <div className="inline-flex max-w-full rounded-xl border border-white/10 bg-black/30 p-1 text-xs">
          <button
            type="button"
            onClick={() => handleViewChange("current")}
            className={`rounded-lg px-2 py-1 ${
              view === "current" ? "bg-sky-500/25 text-sky-100 shadow-inner" : "text-slate-300"
            }`}
          >
            Current ({weekRanges.current})
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("last")}
            className={`rounded-lg px-2 py-1 ${
              view === "last" ? "bg-sky-500/25 text-sky-100 shadow-inner" : "text-slate-300"
            }`}
          >
            Last ({weekRanges.last})
          </button>
        </div>
      </div>

      <div className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article
            key={row.teamName}
            className="rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2.5 transition hover:border-sky-300/30 hover:from-sky-500/[0.08] hover:to-white/[0.03]"
          >
            {row.fixture ? (
              <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Image src={row.leagueFlag} alt={row.teamName} width={14} height={14} className="h-3.5 w-3.5 rounded-full" />
                    <span className="truncate text-[11px] text-slate-400">{row.leagueName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {row.fixture.date ? formatDate(row.fixture.date) : "TBD"} • {row.fixture.kickoff}
                  </p>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  {(() => {
                    const trackedSide = {
                      name: row.teamName,
                      logo: row.teamLogo,
                    };
                    const opponentSide = {
                      name: row.fixture.opponent,
                      logo: row.fixture.opponentLogo,
                    };
                    const leftSide = row.fixture.venue === "away" ? opponentSide : trackedSide;
                    const rightSide = row.fixture.venue === "away" ? trackedSide : opponentSide;

                    return (
                      <>
                        <div className="flex min-w-0 items-center gap-2">
                          {leftSide.logo ? (
                            <Image src={leftSide.logo} alt={leftSide.name} width={22} height={22} className="h-[22px] w-[22px] rounded-full" />
                          ) : (
                            <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-[9px] font-semibold text-slate-300">
                              {getOpponentInitials(leftSide.name)}
                            </span>
                          )}
                          <span className="truncate text-[11px] text-slate-200">{leftSide.name}</span>
                        </div>

                        <span
                          className={`rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] ${
                            getResultScore(row.fixture.result)
                              ? getResultClassName(row.fixture.result)
                              : "uppercase tracking-wide text-slate-300"
                          }`}
                        >
                          {getResultScore(row.fixture.result) ?? "vs"}
                        </span>

                        <div className="flex min-w-0 items-center justify-end gap-2">
                          <span className="truncate text-right text-[11px] text-slate-200">{rightSide.name}</span>
                          {rightSide.logo ? (
                            <Image src={rightSide.logo} alt={rightSide.name} width={22} height={22} className="h-[22px] w-[22px] rounded-full" />
                          ) : (
                            <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-[9px] font-semibold text-slate-300">
                              {getOpponentInitials(rightSide.name)}
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/30 px-3 py-4 text-center">
                <div className="mb-1 flex items-center justify-center gap-1.5">
                  <Image src={row.leagueFlag} alt={row.teamName} width={14} height={14} className="h-3.5 w-3.5 rounded-full" />
                  <span className="text-[11px] text-slate-400">{row.leagueName}</span>
                </div>
                <p className="text-xs text-slate-400">Fixture TBD</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
