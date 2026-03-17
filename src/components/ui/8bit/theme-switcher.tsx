import { cn } from "@/lib/utils";
import { useActiveTheme } from "./active-theme";
import { retroThemeOptions } from "./themes";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { activeTheme, setActiveTheme } = useActiveTheme();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="retro text-[9px] text-amber-200 uppercase tracking-[0.24em]">
        Theme
      </span>
      {retroThemeOptions.map((themeOption) => {
        const selected = themeOption.value === activeTheme;

        return (
          <button
            key={themeOption.value}
            type="button"
            className={cn(
              "retro border-2 px-3 py-2 text-[9px] uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card/80 text-foreground",
            )}
            onClick={() => {
              setActiveTheme(themeOption.value);
            }}
          >
            {themeOption.label}
          </button>
        );
      })}
    </div>
  );
}
