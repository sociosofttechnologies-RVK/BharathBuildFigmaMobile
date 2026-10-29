// 05 · Filters sheet (presented as a form sheet over Search)
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, MapPin, ShieldCheck, SlidersHorizontal, X } from "lucide-react-native";
import { C, R } from "@/theme";
import { Button, Chip, IconButton, OptionTile, Toggle, Txt } from "@/components/ui";
import { CITIES, PickerSheet } from "@/components/PickerSheet";
import { CATEGORIES } from "@/lib/categories";
import { searchListings } from "@/lib/listings";
import { DEFAULT_FILTERS, refine, useSearch, type Filters } from "@/context/SearchContext";

const RATINGS = [{ v: 0, l: "Any" }, { v: 3, l: "3+ ★" }, { v: 4, l: "4+ ★" }, { v: 4.5, l: "4.5+ ★" }];
const EXPS = [{ v: 0, l: "Any" }, { v: 2, l: "2+ yrs" }, { v: 5, l: "5+ yrs" }, { v: 10, l: "10+ yrs" }];

export default function FiltersSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, set } = useSearch();
  const [draft, setDraft] = useState<Filters>(filters);
  const [showAll, setShowAll] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const patch = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }));

  const q = useQuery({
    queryKey: ["search", draft.category, draft.location, draft.keyword],
    queryFn: () => searchListings({ category: draft.category, location: draft.location, keyword: draft.keyword }),
  });
  const count = useMemo(() => refine(q.data ?? [], draft).length, [q.data, draft]);
  const cats = showAll ? CATEGORIES : CATEGORIES.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <View style={{ paddingTop: 10, paddingLeft: 16, paddingRight: 6, paddingBottom: 8, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border }}>
        <SlidersHorizontal size={18} color={C.orange} />
        <Txt heading size={19} style={{ flex: 1, marginLeft: 8 }}>Filters</Txt>
        <IconButton icon={X} label="Close filters" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View>
          <Txt weight="bold" style={{ marginBottom: 10 }}>Category</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip label="All" selected={!draft.category} onPress={() => patch({ category: "" })} />
            {cats.map((c) => <Chip key={c.key} label={c.label} selected={draft.category === c.key} onPress={() => patch({ category: c.key })} />)}
            {!showAll && <Chip label={`+${CATEGORIES.length - 5} more`} onPress={() => setShowAll(true)} />}
          </View>
        </View>

        <View>
          <Txt weight="bold" style={{ marginBottom: 10 }}>Location</Txt>
          <Pressable accessibilityRole="button" accessibilityLabel={`Location ${draft.location || "All India"}`} onPress={() => setCityOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, borderRadius: R.md }}>
            <MapPin size={18} color={C.orange} />
            <Txt size={15} weight="semibold" style={{ flex: 1 }}>{draft.location || "All India"}</Txt>
            <ChevronDown size={16} color={C.muted} />
          </Pressable>
        </View>

        <View>
          <Txt weight="bold" style={{ marginBottom: 10 }}>Minimum rating</Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {RATINGS.map((r) => <OptionTile key={r.l} label={r.l} selected={draft.minRating === r.v} onPress={() => patch({ minRating: r.v })} />)}
          </View>
        </View>

        <View>
          <Txt weight="bold" style={{ marginBottom: 10 }}>Experience</Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {EXPS.map((r) => <OptionTile key={r.l} label={r.l} selected={draft.minExp === r.v} onPress={() => patch({ minExp: r.v })} />)}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color={C.greenIcon} />
            <Txt weight="semibold">Verified vendors only</Txt>
          </View>
          <Toggle label="Verified vendors only" value={draft.verifiedOnly} onChange={(v) => patch({ verifiedOnly: v })} />
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) + 8, flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: C.border }}>
        <Button title="Reset" variant="outline" style={{ flex: 1 }} onPress={() => setDraft({ ...DEFAULT_FILTERS, location: draft.location, keyword: draft.keyword })} />
        <Button title={q.isLoading ? "Show results" : `Show ${count} results`} style={{ flex: 2 }} onPress={() => { set(draft); router.back(); }} />
      </View>

      <PickerSheet visible={cityOpen} title="Choose location" searchable allowCustom value={draft.location}
        options={[{ value: "", label: "All India" }, ...CITIES.map((c) => ({ value: c, label: c }))]}
        onSelect={(v) => patch({ location: v })} onClose={() => setCityOpen(false)} />
    </View>
  );
}
