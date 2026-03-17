export const RetroTheme = {
  default: "default",
  sega: "sega",
  gameboy: "gameboy",
  atari: "atari",
  nintendo: "nintendo",
  arcade: "arcade",
  "neo-geo": "neo-geo",
  "soft-pop": "soft-pop",
  pacman: "pacman",
  vhs: "vhs",
  cassette: "cassette",
  "rusty-byte": "rusty-byte",
  zelda: "zelda",
} as const;

export type RetroTheme = (typeof RetroTheme)[keyof typeof RetroTheme];

export const DEFAULT_RETRO_THEME: RetroTheme = RetroTheme.default;

export const retroThemeOptions: Array<{
  color: string;
  label: string;
  value: RetroTheme;
}> = [
  { label: "Default", value: RetroTheme.default, color: "#000000" },
  { label: "Sega", value: RetroTheme.sega, color: "#0055a4" },
  { label: "Game Boy", value: RetroTheme.gameboy, color: "#8bac0f" },
  { label: "Atari", value: RetroTheme.atari, color: "#7a4009" },
  { label: "Nintendo", value: RetroTheme.nintendo, color: "#104cb0" },
  { label: "Arcade", value: RetroTheme.arcade, color: "#f07cd4" },
  { label: "Neo Geo", value: RetroTheme["neo-geo"], color: "#dc2626" },
  { label: "Soft Pop", value: RetroTheme["soft-pop"], color: "#4b3f99" },
  { label: "Pacman", value: RetroTheme.pacman, color: "#ffcc00" },
  { label: "VHS", value: RetroTheme.vhs, color: "#8b5cf6" },
  { label: "Cassette", value: RetroTheme.cassette, color: "#8b5a2b" },
  {
    label: "Rusty Byte",
    value: RetroTheme["rusty-byte"],
    color: "#d2691e",
  },
  { label: "Zelda", value: RetroTheme.zelda, color: "oklch(0.75 0.2 90)" },
];

export function isRetroTheme(value: string): value is RetroTheme {
  return retroThemeOptions.some((option) => option.value === value);
}
