import React, { useCallback, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { C } from "@/theme";
import { EmptyState, IconButton, Initial, ScreenHeader, Txt } from "@/components/ui";
import { getSaved, toggleSaved, type SavedVendor } from "@/lib/local";

export default function Saved() {
  const router = useRouter();
  const [list, setList] = useState<SavedVendor[]>([]);
  useFocusEffect(useCallback(() => { getSaved().then(setList); }, []));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Saved vendors" />
      <FlatList
        data={list}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<EmptyState icon={Heart} title="No saved vendors" body="Tap the heart on a vendor's page to keep it here." action="Find vendors" onAction={() => router.push("/search")} />}
        renderItem={({ item: v }) => (
          <Pressable onPress={() => router.push({ pathname: "/listing/[id]", params: { id: v.id } })}
            style={{ padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Initial name={v.name} size={44} />
            <View style={{ flex: 1 }}>
              <Txt weight="bold" numberOfLines={1}>{v.name}</Txt>
              <Txt size={12} color={C.muted}>★ {v.rating.toFixed(1)} · {v.categoryLabel} · {v.city}</Txt>
            </View>
            <IconButton icon={Heart} label="Remove from saved" color={C.orange} onPress={async () => { await toggleSaved(v); setList(await getSaved()); }} />
          </Pressable>
        )}
      />
    </View>
  );
}
