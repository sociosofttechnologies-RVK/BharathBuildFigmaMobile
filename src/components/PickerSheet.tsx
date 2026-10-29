import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Search, X } from "lucide-react-native";
import { C, F, R } from "@/theme";
import { IconButton, Txt } from "@/components/ui";

export type PickerOption = { value: string; label: string };

/** Bottom-sheet list picker used for city, category, sub-category, business type. */
export function PickerSheet({ visible, title, options, value, onSelect, onClose, searchable, allowCustom }: {
  visible: boolean; title: string; options: PickerOption[]; value?: string;
  onSelect: (v: string) => void; onClose: () => void; searchable?: boolean; allowCustom?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.filter((o) => o.label.toLowerCase().includes(t)) : options;
  }, [q, options]);
  const pick = (v: string) => { setQ(""); onSelect(v); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: C.overlay }} onPress={onClose} />
      <View style={{ maxHeight: "75%", backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 8 }}>
        <View style={{ alignSelf: "center", marginTop: 8, width: 40, height: 5, borderRadius: 3, backgroundColor: C.borderStrong }} />
        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Txt heading size={18} style={{ flex: 1 }}>{title}</Txt>
          <IconButton icon={X} label="Close" onPress={onClose} />
        </View>
        {searchable && (
          <View style={{ margin: 12, flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.chip }}>
            <Search size={17} color={C.muted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={C.muted} autoFocus style={{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.navy }} returnKeyType="done"
              onSubmitEditing={() => allowCustom && q.trim() && pick(q.trim())} />
          </View>
        )}
        <FlatList
          data={list}
          keyExtractor={(o) => o.value || "_all"}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={allowCustom && q.trim() && !list.some((o) => o.label.toLowerCase() === q.trim().toLowerCase()) ? (
            <Pressable onPress={() => pick(q.trim())} style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Txt weight="semibold" color={C.orangeDark}>Use “{q.trim()}”</Txt>
            </Pressable>
          ) : undefined}
          renderItem={({ item }) => {
            const on = item.value === value;
            return (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => pick(item.value)}
                style={({ pressed }) => [{ minHeight: 50, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.divider }, pressed && { backgroundColor: C.bg }]}>
                <Txt size={15} weight={on ? "bold" : "regular"} color={on ? C.orangeDark : C.navy} style={{ flex: 1 }}>{item.label}</Txt>
                {on && <Check size={18} color={C.orange} />}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export const CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Delhi", "Kolkata", "Ahmedabad", "Coimbatore", "Madurai", "Tiruchirappalli", "Kochi", "Visakhapatnam", "Vijayawada", "Mysuru", "Jaipur", "Lucknow", "Nagpur", "Indore", "Bhubaneswar"];
