import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getLastLocation, setLastLocation } from "@/lib/local";
import type { Listing } from "@/lib/listings";

export type SortKey = "relevance" | "rating" | "reviews" | "experience";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "rating", label: "Top rated" },
  { key: "reviews", label: "Most reviewed" },
  { key: "experience", label: "Most experienced" },
];

export type Filters = { category: string; location: string; keyword: string; minRating: number; minExp: number; verifiedOnly: boolean; sort: SortKey };
export const DEFAULT_FILTERS: Filters = { category: "", location: "", keyword: "", minRating: 0, minExp: 0, verifiedOnly: false, sort: "relevance" };

type Ctx = { filters: Filters; set: (patch: Partial<Filters>) => void; reset: () => void; activeCount: number };
const SearchCtx = createContext<Ctx | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  useEffect(() => { getLastLocation().then((l) => l && setFilters((f) => ({ ...f, location: f.location || l }))); }, []);
  const value = useMemo<Ctx>(() => ({
    filters,
    set: (patch) => setFilters((f) => {
      if (patch.location !== undefined && patch.location !== f.location) setLastLocation(patch.location);
      return { ...f, ...patch };
    }),
    reset: () => setFilters((f) => ({ ...DEFAULT_FILTERS, location: f.location, keyword: f.keyword, category: f.category })),
    activeCount: (filters.minRating ? 1 : 0) + (filters.minExp ? 1 : 0) + (filters.verifiedOnly ? 1 : 0),
  }), [filters]);
  return <SearchCtx.Provider value={value}>{children}</SearchCtx.Provider>;
}

export function useSearch() {
  const c = useContext(SearchCtx);
  if (!c) throw new Error("useSearch must be used inside SearchProvider");
  return c;
}

/** Client-side refinements on top of the server query (rating / experience / verified / sort). */
export function refine(list: Listing[], f: Filters) {
  let r = list.filter((l) => l.rating >= f.minRating && l.experience >= f.minExp && (!f.verifiedOnly || l.verified));
  if (f.sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
  if (f.sort === "reviews") r = [...r].sort((a, b) => b.reviews - a.reviews);
  if (f.sort === "experience") r = [...r].sort((a, b) => b.experience - a.experience);
  return r;
}
