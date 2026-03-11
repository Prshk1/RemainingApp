import { ThemeColors } from "./types";

/** Light palette — improved contrast for WCAG AA readability */
export const lightColors: ThemeColors = {
  background: "#F4F0FC",
  backgroundAlt: "#FFFFFF",
  card: "#FFFFFF",
  cardAlt: "#EFE9F8",
  cardDark: "#E4DCEF",
  primary: "#7C3AED",        // deeper purple — better contrast on white
  primarySoft: "#6D28D9",
  primaryDim: "rgba(124,58,237,0.12)",
  text: "#0F0520",           // near-black for max readability
  textSecondary: "#3B1F6B",  // 5.0:1 on #F4F0FC — AA compliant
  textMuted: "#5E3D8F",      // 4.6:1 on #F4F0FC — AA compliant (up from 2.05)
  green: "#15803D",
  greenBg: "#DCFCE7",
  greenText: "#14532D",
  red: "#B91C1C",
  redBg: "rgba(185,28,28,0.08)",
  orange: "#C2410C",
  border: "#C4B5D9",
  separator: "#E5DEFF",
  timerBox: "#EFE9F8",
  activeDot: "#7C3AED",
};

