export const PRIMARY_COLOR_FAMILIES = {
  red: { label: "Red", rgb: "239 68 68" },
  orange: { label: "Orange", rgb: "249 115 22" },
  amber: { label: "Amber", rgb: "245 158 11" },
  yellow: { label: "Yellow", rgb: "234 179 8" },
  lime: { label: "Lime", rgb: "132 204 22" },
  green: { label: "Green", rgb: "34 197 94" },
  emerald: { label: "Emerald", rgb: "16 185 129" },
  teal: { label: "Teal", rgb: "20 184 166" },
  cyan: { label: "Cyan", rgb: "6 182 212" },
  sky: { label: "Sky", rgb: "14 165 233" },
  blue: { label: "Blue", rgb: "59 130 246" },
  indigo: { label: "Indigo", rgb: "99 102 241" },
  violet: { label: "Violet", rgb: "139 92 246" },
  purple: { label: "Purple", rgb: "168 85 247" },
  fuchsia: { label: "Fuchsia", rgb: "217 70 239" },
  pink: { label: "Pink", rgb: "236 72 153" },
  rose: { label: "Rose", rgb: "244 63 94" },
} as const;

export type PrimaryColorFamily = keyof typeof PRIMARY_COLOR_FAMILIES;

export const DEFAULT_PRIMARY_COLOR_FAMILY: PrimaryColorFamily = "indigo";

export const PRIMARY_COLOR_OPTIONS = Object.entries(PRIMARY_COLOR_FAMILIES).map(
  ([value, config]) => ({ value: value as PrimaryColorFamily, ...config }),
);
