"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { starRepo, unstarRepo } from "@/app/(app)/repos/actions";
import { cn, formatNumber } from "@/lib/utils";

interface StarButtonProps {
  owner: string;
  repo: string;
  starred: boolean;
  starCount: number;
}

export function StarButton({ owner, repo, starred, starCount }: StarButtonProps) {
  const [isStarred, setIsStarred] = useState(starred);
  const [count, setCount] = useState(starCount);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !isStarred;
    setIsStarred(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = next
        ? await starRepo(owner, repo)
        : await unstarRepo(owner, repo);
      if (res.error) {
        setIsStarred(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "flex items-center justify-center gap-1.5 text-[11px] font-mono py-1.5 border transition-colors cursor-pointer",
        isStarred
          ? "border-amber-500/30 text-amber-500 hover:bg-amber-500/10 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10"
          : "border-border text-muted-foreground hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-600",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      <Star
        className={cn("w-3 h-3", isStarred && "fill-current")}
      />
      {isStarred ? "Starred" : "Star"}
      <span className={cn(
        "text-[10px] ml-0.5",
        isStarred ? "text-amber-500/70 dark:text-amber-400/70" : "text-muted-foreground/60"
      )}>
        {formatNumber(count)}
      </span>
    </button>
  );
}
