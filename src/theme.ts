// Design tokens taken from the "BharathBuild Mobile App Screens" canvas.
export const C = {
  bg: "#F8F9FB",
  surface: "#FFFFFF",
  border: "#E6E9EE",
  borderStrong: "#D5DAE1",
  divider: "#EEF0F3",
  navy: "#0D2B45",
  navyTint: "#E9EDF1",
  navyMuted: "#C9D3DC",
  orange: "#F97316",
  orangeDark: "#C2410C",
  orangeTint: "#FEF1E7",
  orangeBorder: "#FBCFA8",
  muted: "#5B6876",
  body: "#46525F",
  chip: "#F1F3F6",
  green: "#1E7A44",
  greenIcon: "#1E8A4C",
  greenTint: "#EAF6EF",
  greenBorder: "#B7E0C7",
  amber: "#8A5A00",
  amberTint: "#FFF4DB",
  danger: "#B42318",
  dangerTint: "#FEECEB",
  white: "#FFFFFF",
  overlay: "rgba(13,43,69,0.55)",
};

export const F = {
  heading: "Montserrat_700Bold",
  headingXB: "Montserrat_800ExtraBold",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const R = { sm: 7, md: 12, lg: 16, xl: 18, pill: 999 };

export const shadow = {
  card: { shadowColor: C.navy, shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  soft: { shadowColor: C.navy, shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  orange: { shadowColor: C.orange, shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
};

export const BOTTOM_NAV_HEIGHT = 60;
