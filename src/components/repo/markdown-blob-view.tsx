"use client";

import { useState } from "react";
import { Code2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarkdownBlobView({
  rawView,
  previewView,
}: {
  rawView: React.ReactNode;
  previewView: React.ReactNode;
}) {
  const [mode, setMode] = useState<"preview" | "raw">("preview");

  return (
    <div>
      <div className="flex items-center justify-end gap-0.5 mb-2">
        <button
          onClick={() => setMode("raw")}
          className={cn(
            "p-1 rounded-md transition-colors cursor-pointer",
            mode === "raw"
              ? "text-foreground bg-zinc-200/60 dark:bg-zinc-800"
              : "text-muted-foreground/50 hover:text-foreground"
          )}
          title="Raw source"
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMode("preview")}
          className={cn(
            "p-1 rounded-md transition-colors cursor-pointer",
            mode === "preview"
              ? "text-foreground bg-zinc-200/60 dark:bg-zinc-800"
              : "text-muted-foreground/50 hover:text-foreground"
          )}
          title="Preview"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={mode === "raw" ? "block" : "hidden"}>{rawView}</div>
      <div className={mode === "preview" ? "block" : "hidden"}>{previewView}</div>
    </div>
  );
}
