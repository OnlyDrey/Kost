export type PrimaryColorFamily =
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

export interface PrimaryColorConfig {
  label: string;
  rgb: string;
  hoverRgb: string;
  pressedRgb: string;
}

export const PRIMARY_COLOR_FAMILIES: Record<
  PrimaryColorFamily,
  PrimaryColorConfig
> = {
  slate: {
    label: "Slate",
    rgb: "100 116 139",
    hoverRgb: "71 85 105",
    pressedRgb: "51 65 85",
  },
  gray: {
    label: "Gray",
    rgb: "107 114 128",
    hoverRgb: "75 85 99",
    pressedRgb: "55 65 81",
  },
  zinc: {
    label: "Zinc",
    rgb: "113 113 122",
    hoverRgb: "82 82 91",
    pressedRgb: "63 63 70",
  },
  neutral: {
    label: "Neutral",
    rgb: "115 115 115",
    hoverRgb: "82 82 82",
    pressedRgb: "64 64 64",
  },
  stone: {
    label: "Stone",
    rgb: "120 113 108",
    hoverRgb: "87 83 78",
    pressedRgb: "68 64 60",
  },
  red: {
    label: "Red",
    rgb: "239 68 68",
    hoverRgb: "220 38 38",
    pressedRgb: "185 28 28",
  },
  orange: {
    label: "Orange",
    rgb: "249 115 22",
    hoverRgb: "234 88 12",
    pressedRgb: "194 65 12",
  },
  amber: {
    label: "Amber",
    rgb: "245 158 11",
    hoverRgb: "217 119 6",
    pressedRgb: "180 83 9",
  },
  yellow: {
    label: "Yellow",
    rgb: "234 179 8",
    hoverRgb: "202 138 4",
    pressedRgb: "161 98 7",
  },
  lime: {
    label: "Lime",
    rgb: "132 204 22",
    hoverRgb: "101 163 13",
    pressedRgb: "77 124 15",
  },
  green: {
    label: "Green",
    rgb: "34 197 94",
    hoverRgb: "22 163 74",
    pressedRgb: "21 128 61",
  },
  emerald: {
    label: "Emerald",
    rgb: "16 185 129",
    hoverRgb: "5 150 105",
    pressedRgb: "4 120 87",
  },
  teal: {
    label: "Teal",
    rgb: "20 184 166",
    hoverRgb: "13 148 136",
    pressedRgb: "15 118 110",
  },
  cyan: {
    label: "Cyan",
    rgb: "6 182 212",
    hoverRgb: "8 145 178",
    pressedRgb: "14 116 144",
  },
  sky: {
    label: "Sky",
    rgb: "14 165 233",
    hoverRgb: "2 132 199",
    pressedRgb: "3 105 161",
  },
  blue: {
    label: "Blue",
    rgb: "59 130 246",
    hoverRgb: "37 99 235",
    pressedRgb: "29 78 216",
  },
  indigo: {
    label: "Indigo",
    rgb: "99 102 241",
    hoverRgb: "79 70 229",
    pressedRgb: "67 56 202",
  },
  violet: {
    label: "Violet",
    rgb: "139 92 246",
    hoverRgb: "124 58 237",
    pressedRgb: "109 40 217",
  },
  purple: {
    label: "Purple",
    rgb: "168 85 247",
    hoverRgb: "147 51 234",
    pressedRgb: "126 34 206",
  },
  fuchsia: {
    label: "Fuchsia",
    rgb: "217 70 239",
    hoverRgb: "192 38 211",
    pressedRgb: "162 28 175",
  },
  pink: {
    label: "Pink",
    rgb: "236 72 153",
    hoverRgb: "219 39 119",
    pressedRgb: "190 24 93",
  },
  rose: {
    label: "Rose",
    rgb: "244 63 94",
    hoverRgb: "225 29 72",
    pressedRgb: "190 18 60",
  },
};

export const DEFAULT_PRIMARY_COLOR_FAMILY: PrimaryColorFamily = "indigo";

export const PRIMARY_COLOR_OPTIONS = Object.entries(PRIMARY_COLOR_FAMILIES).map(
  ([value, config]) => ({ value: value as PrimaryColorFamily, ...config }),
);
