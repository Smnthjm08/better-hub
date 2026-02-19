"use client";

import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/lib/user-settings-store";

interface GeneralTabProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
}

export function GeneralTab({ settings, onUpdate }: GeneralTabProps) {
  const { setTheme } = useTheme();

  const themes = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <div className="divide-y divide-border">
      {/* Theme */}
      <div className="px-4 py-4">
        <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Theme
        </label>
        <div className="flex gap-2 mt-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                onUpdate({ theme: value });
              }}
              className={cn(
                "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer",
                settings.theme === value
                  ? "border-foreground/30 text-foreground bg-muted/50 dark:bg-white/[0.04]"
                  : "border-border text-muted-foreground hover:text-foreground/60 hover:border-foreground/10"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
