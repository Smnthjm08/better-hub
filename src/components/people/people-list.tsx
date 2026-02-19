"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, formatNumber } from "@/lib/utils";
import {
  ListSearchInput,
  SortCycleButton,
} from "@/components/shared/list-controls";

interface Person {
  login: string;
  avatar_url: string;
  contributions: number;
  weeklyCommits: number[];
  additions: number;
  deletions: number;
  monthAdditions: number;
  monthDeletions: number;
}

interface PeopleListProps {
  owner: string;
  repo: string;
  people: Person[];
}

type SortMode = "contributions" | "total" | "alpha";

const SORT_CYCLE: SortMode[] = ["contributions", "total", "alpha"];
const SORT_LABELS: Record<SortMode, string> = {
  contributions: "This month",
  total: "All-time total",
  alpha: "A → Z",
};

function DiffBadge({ additions, deletions, className }: { additions: number; deletions: number; className?: string }) {
  if (additions === 0 && deletions === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-mono tabular-nums", className)}>
      <span className="text-emerald-600 dark:text-emerald-400">+{formatNumber(additions)}</span>
      <span className="text-red-500/80 dark:text-red-400/80">&minus;{formatNumber(deletions)}</span>
    </span>
  );
}

function Sparkline({
  data,
  size = "md",
}: {
  data: number[];
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? 32 : 24;
  const widthClass = size === "lg" ? "w-28" : "w-full";

  if (data.length === 0 || data.every((d) => d === 0)) {
    return (
      <div
        className={cn("flex items-end gap-px", widthClass)}
        style={{ height: h }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-zinc-200 dark:bg-zinc-800"
            style={{ height: 2 }}
          />
        ))}
      </div>
    );
  }

  const max = Math.max(...data, 1);

  return (
    <div
      className={cn("flex items-end gap-px group/spark", widthClass)}
      style={{ height: h }}
      title={`Last ${data.length} weeks`}
    >
      {data.map((value, i) => {
        const barH = Math.max(2, (value / max) * h);
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm transition-all",
              value > 0
                ? "bg-emerald-500/80 dark:bg-emerald-400/70 group-hover/spark:brightness-110"
                : "bg-zinc-200 dark:bg-zinc-800"
            )}
            style={{ height: barH }}
          />
        );
      })}
    </div>
  );
}

function ContributionBar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-emerald-500/80 dark:bg-emerald-400/70 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PeopleList({ owner, repo, people }: PeopleListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("contributions");

  const isMonthly = sort === "contributions";

  // "this month" = last 4 weeks
  const monthTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of people) {
      const last4 = p.weeklyCommits.slice(-4);
      map[p.login.toLowerCase()] = last4.reduce((s, c) => s + c, 0);
    }
    return map;
  }, [people]);

  // Pre-sort by this month for rank lookup (default sort)
  const byContributions = useMemo(
    () =>
      [...people].sort(
        (a, b) =>
          (monthTotals[b.login.toLowerCase()] ?? 0) -
          (monthTotals[a.login.toLowerCase()] ?? 0)
      ),
    [people, monthTotals]
  );

  const maxMonthly = useMemo(
    () => Math.max(...Object.values(monthTotals), 1),
    [monthTotals]
  );

  const maxContributions = useMemo(
    () => Math.max(...people.map((p) => p.contributions), 1),
    [people]
  );

  const rankMap = useMemo(() => {
    const map: Record<string, number> = {};
    byContributions.forEach((p, i) => {
      map[p.login.toLowerCase()] = i + 1;
    });
    return map;
  }, [byContributions]);

  const filtered = useMemo(() => {
    let list = people;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.login.toLowerCase().includes(q));
    }
    if (sort === "contributions") {
      list = [...list].sort(
        (a, b) =>
          (monthTotals[b.login.toLowerCase()] ?? 0) -
          (monthTotals[a.login.toLowerCase()] ?? 0)
      );
    } else if (sort === "total") {
      list = [...list].sort((a, b) => b.contributions - a.contributions);
    } else {
      list = [...list].sort((a, b) =>
        a.login.toLowerCase().localeCompare(b.login.toLowerCase())
      );
    }
    return list;
  }, [people, search, sort, monthTotals]);

  const isUnfiltered = !search.trim();
  const showPodium =
    isUnfiltered && sort === "contributions" && byContributions.length >= 3;
  const gridPeople = showPodium ? filtered.slice(3) : filtered;
  const podiumPeople = showPodium ? filtered.slice(0, 3) : [];

  // Helper to get sort-aware stats for a person
  const getStats = (person: Person) => {
    const commits = isMonthly
      ? (monthTotals[person.login.toLowerCase()] ?? 0)
      : person.contributions;
    const add = isMonthly ? person.monthAdditions : person.additions;
    const del = isMonthly ? person.monthDeletions : person.deletions;
    const barValue = isMonthly
      ? (monthTotals[person.login.toLowerCase()] ?? 0)
      : person.contributions;
    const barMax = isMonthly ? maxMonthly : maxContributions;
    return { commits, add, del, barValue, barMax };
  };

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <ListSearchInput
          placeholder="Filter by username..."
          value={search}
          onChange={setSearch}
        />
        <SortCycleButton
          sort={sort}
          cycle={SORT_CYCLE}
          labels={SORT_LABELS}
          onSort={setSort}
        />
      </div>

      {/* Section header */}
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {filtered.length} contributor{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-border rounded-md">
          No members found
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {showPodium && (
            <div className="grid grid-cols-3 gap-3">
              {podiumPeople.map((person, i) => {
                const rank = i + 1;
                const { commits, add, del } = getStats(person);
                return (
                  <Link
                    key={person.login}
                    href={`/repos/${owner}/${repo}/people/${person.login}`}
                    className="group border border-border rounded-md p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative overflow-hidden"
                  >
                    {/* Bottom edge bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          rank === 1
                            ? "bg-foreground/80"
                            : "bg-foreground/30"
                        )}
                        style={{
                          width: `${(commits / maxMonthly) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      {/* Rank */}
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        #{rank}
                      </span>

                      {/* Avatar */}
                      <Image
                        src={person.avatar_url}
                        alt={person.login}
                        width={56}
                        height={56}
                        className={cn(
                          "rounded-full ring-2 ring-offset-2 ring-offset-background",
                          rank === 1
                            ? "ring-foreground/40"
                            : "ring-zinc-300 dark:ring-zinc-700"
                        )}
                      />

                      {/* Username */}
                      <span className="font-mono text-sm truncate w-full text-center">
                        {person.login}
                      </span>

                      {/* Sparkline */}
                      <Sparkline data={person.weeklyCommits} size="lg" />

                      {/* Stats */}
                      <div className="text-center space-y-1">
                        <span className="text-xs font-mono text-foreground tabular-nums">
                          {commits.toLocaleString()} commits
                        </span>
                        <DiffBadge additions={add} deletions={del} className="justify-center" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Contributor Grid */}
          {gridPeople.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gridPeople.map((person) => {
                const rank = rankMap[person.login.toLowerCase()] ?? 0;
                const { commits, add, del, barValue, barMax } = getStats(person);
                return (
                  <Link
                    key={person.login}
                    href={`/repos/${owner}/${repo}/people/${person.login}`}
                    className="group border border-border rounded-md p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <span className="text-[10px] font-mono text-muted-foreground/50 w-5 shrink-0 text-right tabular-nums">
                        {rank}
                      </span>

                      {/* Avatar */}
                      <Image
                        src={person.avatar_url}
                        alt={person.login}
                        width={40}
                        height={40}
                        className="rounded-full shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate">
                            {person.login}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto shrink-0 tabular-nums">
                            {commits.toLocaleString()}
                          </span>
                        </div>

                        {/* Sparkline */}
                        <Sparkline data={person.weeklyCommits} size="md" />

                        {/* Stats row: bar + diff */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <ContributionBar value={barValue} max={barMax} />
                          </div>
                          <DiffBadge additions={add} deletions={del} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
