// Category → sub-categories and spec fields for the Create Ad form.
// The web app keeps the authoritative list in src/lib/ad-fields.ts; keep these keys in sync with it
// (spec values are stored in listings.attributes, sub-category slug in listings.subcategory).
export type SpecField =
  | { key: string; label: string; type: "choice"; options: string[] }
  | { key: string; label: string; type: "price"; unit: string }
  | { key: string; label: string; type: "text"; placeholder: string; keyboard?: "numeric" | "default" };

export type SubCategory = { slug: string; label: string; specs?: SpecField[] };

const price = (unit: string): SpecField => ({ key: "price", label: "Price", type: "price", unit });
const experience: SpecField = { key: "experience", label: "Years of experience", type: "text", placeholder: "e.g. 8", keyboard: "numeric" };

export const AD_FIELDS: Record<string, SubCategory[]> = {
  builders: [
    { slug: "independent-houses", label: "Independent houses", specs: [experience] },
    { slug: "apartments", label: "Apartments", specs: [experience] },
    { slug: "commercial", label: "Commercial", specs: [experience] },
    { slug: "renovation", label: "Renovation", specs: [experience] },
    { slug: "approvals", label: "Plan approvals", specs: [experience] },
  ],
  architects: [
    { slug: "residential", label: "Residential design", specs: [experience] },
    { slug: "commercial", label: "Commercial design", specs: [experience] },
    { slug: "landscape", label: "Landscape", specs: [experience] },
  ],
  "interior-designers": [
    { slug: "home-interiors", label: "Home interiors", specs: [experience] },
    { slug: "modular-kitchen", label: "Modular kitchen", specs: [experience] },
    { slug: "office-interiors", label: "Office interiors", specs: [experience] },
  ],
  labourers: [
    { slug: "mason", label: "Mason", specs: [experience, price("per day")] },
    { slug: "helper", label: "Helper", specs: [experience, price("per day")] },
    { slug: "carpenter", label: "Carpenter", specs: [experience, price("per day")] },
    { slug: "painter", label: "Painter", specs: [experience, price("per day")] },
  ],
  "construction-materials": [
    { slug: "cement", label: "Cement", specs: [{ key: "grade", label: "Grade", type: "choice", options: ["OPC 53", "OPC 43", "PPC"] }, price("per bag")] },
    { slug: "steel", label: "Steel / TMT", specs: [{ key: "grade", label: "Grade", type: "choice", options: ["Fe 500", "Fe 500D", "Fe 550"] }, price("per kg")] },
    { slug: "sand", label: "Sand", specs: [{ key: "type", label: "Type", type: "choice", options: ["M-Sand", "P-Sand", "River sand"] }, price("per unit")] },
    { slug: "bricks", label: "Bricks & blocks", specs: [{ key: "type", label: "Type", type: "choice", options: ["Red brick", "Fly ash", "AAC block"] }, price("per piece")] },
    { slug: "aggregates", label: "Aggregates", specs: [{ key: "size", label: "Size", type: "choice", options: ["6 mm", "12 mm", "20 mm", "40 mm"] }, price("per unit")] },
  ],
  "construction-vehicles": [
    { slug: "jcb", label: "JCB / Backhoe", specs: [price("per hour")] },
    { slug: "crane", label: "Crane", specs: [{ key: "capacity", label: "Capacity", type: "text", placeholder: "e.g. 20 tonne" }, price("per day")] },
    { slug: "tipper", label: "Tipper / Lorry", specs: [price("per trip")] },
    { slug: "mixer", label: "Concrete mixer", specs: [price("per day")] },
  ],
  jobs: [
    { slug: "site-engineer", label: "Site engineer", specs: [{ key: "salary", label: "Salary", type: "price", unit: "per month" }] },
    { slug: "supervisor", label: "Supervisor", specs: [{ key: "salary", label: "Salary", type: "price", unit: "per month" }] },
    { slug: "draftsman", label: "Draftsman", specs: [{ key: "salary", label: "Salary", type: "price", unit: "per month" }] },
  ],
  technicians: [
    { slug: "electrician", label: "Electrician", specs: [experience] },
    { slug: "plumber", label: "Plumber", specs: [experience] },
    { slug: "waterproofing", label: "Waterproofing", specs: [experience] },
    { slug: "welder", label: "Welder", specs: [experience] },
  ],
  "labour-agents": [
    { slug: "skilled", label: "Skilled labour supply", specs: [{ key: "team", label: "Team size", type: "text", placeholder: "e.g. 25", keyboard: "numeric" }] },
    { slug: "unskilled", label: "Unskilled labour supply", specs: [{ key: "team", label: "Team size", type: "text", placeholder: "e.g. 50", keyboard: "numeric" }] },
  ],
};

export const subLabel = (cat: string, slug?: string | null) => AD_FIELDS[cat]?.find((s) => s.slug === slug)?.label ?? slug ?? "";
