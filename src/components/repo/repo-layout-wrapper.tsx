"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoLayoutWrapperProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  owner: string;
  repo: string;
  avatarUrl?: string;
}

function NavBreadcrumb({ owner, repo, avatarUrl }: { owner: string; repo: string; avatarUrl?: string }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById("navbar-breadcrumb"));
  }, []);

  if (!container) return null;

  return createPortal(
    <>
      <span className="text-muted-foreground/30 mx-1.5">/</span>
      <Link
        href={`/orgs/${owner}`}
        className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
      >
        {owner}
      </Link>
      <span className="text-muted-foreground/25 mx-1">/</span>
      <Link
        href={`/repos/${owner}/${repo}`}
        className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        {repo}
      </Link>
    </>,
    container
  );
}

export function RepoLayoutWrapper({ sidebar, children, owner, repo, avatarUrl }: RepoLayoutWrapperProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = ev.clientX - dragRef.current.startX;
      setSidebarWidth(Math.max(180, Math.min(480, dragRef.current.startWidth + delta)));
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, [sidebarWidth]);

  return (
    <>
    <NavBreadcrumb owner={owner} repo={repo} avatarUrl={avatarUrl} />
    <div className="flex flex-col lg:flex-row flex-1 min-h-0">
      {/* Sidebar */}
      <div
        className={cn(
          "hidden lg:flex shrink-0 overflow-hidden relative",
          !sidebarVisible && "w-0 opacity-0"
        )}
        style={sidebarVisible ? { width: sidebarWidth } : undefined}
      >
        <div style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
          {sidebar}
        </div>
      </div>

      {/* Sidebar resize handle + toggle */}
      <div
        className={cn(
          "hidden lg:flex shrink-0 z-10 flex-col items-center",
          sidebarVisible ? "relative" : "absolute left-0 top-0 h-full"
        )}
      >
        {sidebarVisible && (
          <div
            onMouseDown={handleDragStart}
            className="flex-1 w-1 cursor-col-resize flex items-center justify-center hover:bg-foreground/10 active:bg-foreground/15 transition-colors group/resize"
          >
            <div className="w-[2px] h-8 rounded-full bg-border group-hover/resize:bg-foreground/20 group-active/resize:bg-foreground/30 transition-colors" />
          </div>
        )}
        <button
          onClick={() => setSidebarVisible((v) => !v)}
          className={cn(
            "flex items-center justify-center w-5 h-8 shrink-0",
            "text-muted-foreground/0 hover:text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/40",
            "cursor-pointer transition-all duration-150",
            !sidebarVisible && "mt-2 rounded-md"
          )}
          title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarVisible ? (
            <ChevronsLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronsRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {children}
      </div>
    </div>
    </>
  );
}
