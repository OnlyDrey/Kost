export const PRIMARY_COLOR_FAMILIES = {
  pink: { label: "Pink", rgb: "236 72 153" },
  fuchsia: { label: "Fuchsia", rgb: "217 70 239" },
  purple: { label: "Purple", rgb: "168 85 247" },
  violet: { label: "Violet", rgb: "139 92 246" },
  indigo: { label: "Indigo", rgb: "99 102 241" },
  blue: { label: "Blue", rgb: "59 130 246" },
  sky: { label: "Sky", rgb: "14 165 233" },
  cyan: { label: "Cyan", rgb: "6 182 212" },
  amber: { label: "Amber", rgb: "245 158 11" },
} as const;

export type PrimaryColorFamily = keyof typeof PRIMARY_COLOR_FAMILIES;

export const DEFAULT_PRIMARY_COLOR_FAMILY: PrimaryColorFamily = "indigo";

export const PRIMARY_COLOR_OPTIONS = Object.entries(PRIMARY_COLOR_FAMILIES).map(
  ([value, config]) => ({ value: value as PrimaryColorFamily, ...config }),
);
