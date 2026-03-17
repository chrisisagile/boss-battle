"use client";

import { cn } from "@/lib/utils";
import { useActiveTheme } from "./active-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import type { RetroTheme } from "./themes";
import { retroThemeOptions } from "./themes";

export function ThemeSelector({ className }: { className?: string }) {
  const { activeTheme, setActiveTheme } = useActiveTheme();

  return (
    <div className={cn("space-y-2", className)}>
      <p className="retro text-[9px] text-primary uppercase tracking-[0.24em]">
        Theme
      </p>
      <Select
        value={activeTheme}
        onValueChange={(value) => setActiveTheme(value as RetroTheme)}
      >
        <SelectTrigger className="w-full min-w-52 bg-card/90 text-left">
          <SelectValue font="retro" placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent className="bg-card/95">
          {retroThemeOptions.map((themeOption) => (
            <SelectItem key={themeOption.value} value={themeOption.value}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-sm border border-foreground"
                  style={{ backgroundColor: themeOption.color }}
                />
                <span>{themeOption.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
