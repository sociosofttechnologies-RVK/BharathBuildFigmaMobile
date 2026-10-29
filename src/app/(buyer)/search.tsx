// 04 · Search results
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, ChevronLeft, Search as SearchIcon, SearchX, SlidersHorizontal, X } from "lucide-react-native";
import { C, F, R } from "@/theme";
import { Chip, EmptyState, ErrorBox, IconButton, Loading, Txt } from "@/components/ui";
import { ListingCard } from "@/components/brand";
import { PickerSheet } from "@/components/PickerSheet";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { searchListings } from "@/lib/listings";
import { refine, SORTS, useSearch } from "@/context/SearchContext";

const PAGE = 20;

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, set, activeCount } = useSearch();
  const [kw, setKw] = useState(filters.keyword);
  const [sortOpen, setSortOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const q = useQuery({
    queryKey: ["search", filters.category, filters.location, filters.keyword],
    queryFn: () => searchListings({ category: filters.category, location: filters.location, keyword: filters.keyword }),
  });
  const all = useMemo(() => refine(q.data ?? [], filters), [q.data, filters]);
  const shown = all.slice(0, limit);
  const title = filters.category ? categoryLabel(filters.category) : filters.keyword || "All vendors";
  const sortLabel = SORTS.find((s) => s.key === filters.sort)?.label ?? "Relevance";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconButton icon={ChevronLeft} label="Back" size={22} style={{ marginLeft: -10 }} onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))} />
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.chip }}>
            <SearchIcon size={17} color={C.muted} />
            <View style={{ flex: 1 }}>
              <TextInput value={kw} onChangeText={setKw} placeholder={title} placeholderTextColor={C.navy}
                onSubmitEditing={() => { set({ keyword: kw.trim() }); setLimit(PAGE); }} returnKeyType="search" accessibilityLabel="Search keyword"
                style={{ fontFamily: F.bold, fontSize: 14, color: C.navy, padding: 0 }} />
              <Txt size={11} color={C.muted} numberOfLines={1}>{filters.location || "All India"} · {filters.keyword ? `“${filters.keyword}”` : "any keyword"}</Txt>
            </View>
            {!!kw && <Pressable accessibilityLabel="Clear keyword" hitSlop={10} onPress={() => { setKw(""); set({ keyword: "" }); }}><X size={16} color={C.muted} /></Pressable>}
          </View>
          <IconButton icon={SlidersHorizontal} label={`Filters, ${activeCount} applied`} bordered badge={activeCount} onPress={() => router.push("/filters")} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip size="sm" label="All" selected={!filters.category} onPress={() => set({ category: "" })} />
          {CATEGORIES.map((c) => <Chip key={c.key} size="sm" label={c.label} selected={filters.category === c.key} onPress={() => { set({ category: c.key }); setLimit(PAGE); }} />)}
        </ScrollView>
      </View>

      {q.isLoading ? <Loading label="Finding vendors…" /> : q.error ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} /> : (
        <FlatList
          data={shown}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} tintColor={C.orange} />}
          onEndReached={() => setLimit((l) => (l < all.length ? l + PAGE : l))}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={{ paddingTop: 12, paddingBottom: 2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Txt size={13} color={C.muted}>Showing <Txt size={13} weight="bold">{shown.length}</Txt> of <Txt size={13} weight="bold">{all.length}</Txt> results</Txt>
              <Pressable accessibilityRole="button" accessibilityLabel={`Sort: ${sortLabel}`} onPress={() => setSortOpen(true)}
                style={{ height: 34, paddingHorizontal: 10, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.white, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Txt size={13} weight="semibold">{sortLabel}</Txt>
                <ChevronDown size={14} color={C.navy} />
              </Pressable>
            </View>
          }
          ListEmptyComponent={<EmptyState icon={SearchX} title="No vendors found" body="Try another category, a nearby city, or remove some filters." action="Change filters" onAction={() => router.push("/filters")} />}
          renderItem={({ item }) => <ListingCard l={item} />}
        />
      )}

      <PickerSheet visible={sortOpen} title="Sort by" value={filters.sort} options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
        onSelect={(v) => set({ sort: v as typeof filters.sort })} onClose={() => setSortOpen(false)} />
    </View>
  );
}
