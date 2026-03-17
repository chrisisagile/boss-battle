export const RetroTheme = {
  arcade: "arcade",
  pacman: "pacman",
  vhs: "vhs",
  zelda: "zelda",
} as const;

export type RetroTheme = (typeof RetroTheme)[keyof typeof RetroTheme];

export const DEFAULT_RETRO_THEME: RetroTheme = RetroTheme.zelda;

export const retroThemeOptions: Array<{ label: string; value: RetroTheme }> = [
  { label: "Zelda", value: RetroTheme.zelda },
  { label: "Arcade", value: RetroTheme.arcade },
  { label: "Pacman", value: RetroTheme.pacman },
  { label: "VHS", value: RetroTheme.vhs },
];

export function isRetroTheme(value: string): value is RetroTheme {
  return retroThemeOptions.some((option) => option.value === value);
}
