export const CATEGORY_LABEL: Record<string, string> = {
  builders: "Builders",
  architects: "Architects",
  "interior-designers": "Interior Designers",
  labourers: "Labourers",
  "construction-materials": "Construction Materials",
  "construction-vehicles": "Construction Vehicles",
  jobs: "Jobs",
  technicians: "Technicians",
  "labour-agents": "Labour Agents",
};
export const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([key, label]) => ({ key, label }));
export const categoryLabel = (key: string) => CATEGORY_LABEL[key] ?? key;
