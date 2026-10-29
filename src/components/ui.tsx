import React, { useState } from "react";
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronLeft, Star, type LucideIcon } from "lucide-react-native";
import { C, F, R, shadow } from "@/theme";

/* ---------- Text ---------- */
type Weight = "regular" | "medium" | "semibold" | "bold";
type TxtProps = TextProps & { size?: number; weight?: Weight; color?: string; heading?: boolean | "xb"; center?: boolean; lh?: number };
export function Txt({ size = 14, weight = "regular", color = C.navy, heading, center, lh, style, ...p }: TxtProps) {
  const fontFamily = heading === "xb" ? F.headingXB : heading ? F.heading : F[weight];
  return <Text {...p} style={[{ fontFamily, fontSize: size, color, lineHeight: lh ? size * lh : undefined }, center && { textAlign: "center" }, style]} />;
}
export const H1 = (p: TxtProps) => <Txt heading="xb" size={22} {...p} />;
export const H2 = (p: TxtProps) => <Txt heading size={16} {...p} />;

/* ---------- Buttons ---------- */
type BtnVariant = "primary" | "navy" | "outline" | "outlineNavy" | "tint" | "soft";
type BtnProps = Omit<PressableProps, "style"> & {
  title: string; variant?: BtnVariant; icon?: LucideIcon; height?: number; loading?: boolean; style?: StyleProp<ViewStyle>; textSize?: number;
};
export function Button({ title, variant = "primary", icon: Icon, height = 52, loading, disabled, style, textSize = 15, ...p }: BtnProps) {
  const v = BTN[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      {...p}
      style={({ pressed }) => [
        { height, borderRadius: R.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
        v.box, variant === "primary" && shadow.orange,
        (pressed || disabled) && { opacity: disabled ? 0.5 : 0.85 }, style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <>
          {Icon && <Icon size={18} color={v.fg} strokeWidth={2} />}
          <Txt weight="bold" size={textSize} color={v.fg}>{title}</Txt>
        </>
      )}
    </Pressable>
  );
}
const BTN: Record<BtnVariant, { box: ViewStyle; fg: string }> = {
  primary: { box: { backgroundColor: C.orange }, fg: C.white },
  navy: { box: { backgroundColor: C.navy }, fg: C.white },
  outline: { box: { backgroundColor: C.white, borderWidth: 1, borderColor: C.borderStrong }, fg: C.navy },
  outlineNavy: { box: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.navy }, fg: C.navy },
  tint: { box: { backgroundColor: C.orangeTint }, fg: C.orangeDark },
  soft: { box: { backgroundColor: C.navyTint }, fg: C.navy },
};

export function IconButton({ icon: Icon, label, onPress, bordered, round, color = C.navy, size = 20, style, badge, dot }: {
  icon: LucideIcon; label: string; onPress?: () => void; bordered?: boolean; round?: boolean; color?: string; size?: number;
  style?: StyleProp<ViewStyle>; badge?: number; dot?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({ pressed }) => [
        { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: round ? 22 : R.md },
        bordered && { borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
        pressed && { opacity: 0.7 }, style,
      ]}
    >
      <Icon size={size} color={color} strokeWidth={2} />
      {!!badge && (
        <View style={s.badgeCount}><Txt size={11} weight="bold" color={C.white}>{badge}</Txt></View>
      )}
      {dot && <View style={s.dot} />}
    </Pressable>
  );
}

/* ---------- Inputs ---------- */
type FieldProps = TextInputProps & { label?: string; icon?: LucideIcon; right?: React.ReactNode; hint?: string; error?: string; containerStyle?: StyleProp<ViewStyle>; labelRight?: React.ReactNode; prefix?: string; suffix?: string };
export function Field({ label, icon: Icon, right, hint, error, containerStyle, labelRight, multiline, prefix, suffix, style, onFocus, onBlur, ...p }: FieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {(label || labelRight) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          {label ? <Txt size={13} weight="semibold">{label}</Txt> : <View />}
          {labelRight}
        </View>
      )}
      <View
        style={[
          { flexDirection: "row", alignItems: multiline ? "flex-start" : "center", gap: 10, minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.white },
          multiline && { paddingVertical: 10 },
          focus && { borderColor: C.orange, borderWidth: 1.5, ...focusRing },
          !!error && { borderColor: C.danger },
        ]}
      >
        {Icon && <Icon size={18} color={C.muted} strokeWidth={2} />}
        {prefix && <Txt weight="bold" color={C.muted}>{prefix}</Txt>}
        <TextInput
          placeholderTextColor={C.muted}
          multiline={multiline}
          {...p}
          onFocus={(e) => { setFocus(true); onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); onBlur?.(e); }}
          style={[{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.navy, paddingVertical: multiline ? 0 : 12 }, multiline && { minHeight: 64, textAlignVertical: "top" }, style as StyleProp<TextStyle>]}
        />
        {suffix && <Txt size={13} color={C.muted}>{suffix}</Txt>}
        {right}
      </View>
      {!!error && <Txt size={12} color={C.danger}>{error}</Txt>}
      {!!hint && !error && <Txt size={12} color={C.muted}>{hint}</Txt>}
    </View>
  );
}
const focusRing: ViewStyle = { shadowColor: C.orange, shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } };

/** A tappable field that opens a picker (looks like an input with a chevron). */
export function SelectField({ label, value, placeholder, onPress, icon: Icon, right }: { label?: string; value?: string; placeholder?: string; onPress: () => void; icon?: LucideIcon; right?: React.ReactNode }) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      {label && <Txt size={13} weight="semibold">{label}</Txt>}
      <Pressable accessibilityRole="button" accessibilityLabel={label ?? placeholder} onPress={onPress} style={({ pressed }) => [s.select, pressed && { backgroundColor: C.bg }]}>
        {Icon && <Icon size={18} color={C.orange} strokeWidth={2} />}
        <Txt size={15} weight={value ? "semibold" : "regular"} color={value ? C.navy : C.muted} style={{ flex: 1 }} numberOfLines={1}>{value || placeholder}</Txt>
        {right}
      </Pressable>
    </View>
  );
}

/* ---------- Surfaces ---------- */
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[{ backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: R.lg }, padded && { padding: 16 }, style]}>{children}</View>;
}

export function ScreenHeader({ title, onBack, right, subtitle, children }: { title?: string; onBack?: () => void; right?: React.ReactNode; subtitle?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <View style={{ minHeight: 60, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
        <IconButton icon={ChevronLeft} label="Back" size={22} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/home")))} />
        <View style={{ flex: 1 }}>
          {title && <Txt heading size={18} numberOfLines={1}>{title}</Txt>}
          {subtitle && <Txt size={12} color={C.muted}>{subtitle}</Txt>}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/** Large left-aligned page title header used by tab roots (My Ads, Messages, Analytics, Account). */
export function PageHeader({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <H1>{title}</H1>
          {subtitle && <Txt size={13} color={C.muted} style={{ marginTop: 3 }}>{subtitle}</Txt>}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/* ---------- Chips & badges ---------- */
export function Chip({ label, selected, onPress, size = "md" }: { label: string; selected?: boolean; onPress?: () => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? 34 : 36;
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[{ height: h, paddingHorizontal: 14, borderRadius: h / 2, alignItems: "center", justifyContent: "center" },
        selected ? { backgroundColor: C.navy } : { backgroundColor: C.white, borderWidth: 1, borderColor: size === "sm" ? C.border : C.borderStrong }]}
    >
      <Txt size={13} weight="semibold" color={selected ? C.white : C.navy}>{label}</Txt>
    </Pressable>
  );
}

/** Square option tile (orange-tint when selected), used in Filters and Create Ad specs. */
export function OptionTile({ label, selected, onPress, style }: { label: string; selected?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[{ flex: 1, height: 44, borderRadius: R.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
        selected ? { borderWidth: 1.5, borderColor: C.orange, backgroundColor: C.orangeTint } : { borderWidth: 1, borderColor: C.borderStrong }, style]}
    >
      <Txt size={13} weight={selected ? "bold" : "semibold"} color={selected ? C.orangeDark : C.navy} numberOfLines={1}>{label}</Txt>
    </Pressable>
  );
}

type BadgeKind = "verified" | "top" | "neutral" | "rating" | "active" | "paused" | "draft" | "pending";
export function Badge({ kind, label, h = 24 }: { kind: BadgeKind; label?: string; h?: number }) {
  if (kind === "rating") {
    return (
      <View style={[s.badge, { height: h, backgroundColor: C.navyTint, gap: 3 }]}>
        <Star size={12} color={C.orange} fill={C.orange} />
        <Txt size={12} weight="bold">{label}</Txt>
      </View>
    );
  }
  const m = {
    verified: { bg: C.greenTint, bd: C.greenBorder, fg: C.green, text: "Verified" },
    top: { bg: C.orangeTint, bd: C.orangeBorder, fg: C.orangeDark, text: "Top Rated" },
    neutral: { bg: C.chip, bd: C.chip, fg: C.body, text: "" },
    active: { bg: C.greenTint, bd: C.greenTint, fg: C.green, text: "Active" },
    paused: { bg: C.amberTint, bd: C.amberTint, fg: C.amber, text: "Paused" },
    draft: { bg: "#EEF0F3", bd: "#EEF0F3", fg: C.body, text: "Draft" },
    pending: { bg: C.orangeTint, bd: C.orangeBorder, fg: C.orangeDark, text: "In review" },
  }[kind];
  return (
    <View style={[s.badge, { height: h, backgroundColor: m.bg, borderColor: m.bd, borderWidth: 1, gap: 4 }]}>
      {kind === "verified" && <Check size={11} color={m.fg} strokeWidth={2.5} />}
      <Txt size={11} weight={kind === "neutral" ? "semibold" : "bold"} color={m.fg}>{label ?? m.text}</Txt>
    </View>
  );
}

export function Initial({ name, size = 52, round, dark }: { name: string; size?: number; round?: boolean; dark?: boolean }) {
  const ch = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: round ? size / 2 : size * 0.27, backgroundColor: dark ? C.navy : round ? C.navyTint : C.orangeTint, alignItems: "center", justifyContent: "center" }}>
      <Txt heading={round ? undefined : "xb"} weight="bold" size={round ? size * 0.38 : size * 0.42} color={dark ? C.white : round ? C.navy : C.orange}>{ch}</Txt>
    </View>
  );
}

export function IconTile({ icon: Icon, size = 44, iconSize = 22 }: { icon: LucideIcon; size?: number; iconSize?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: C.orangeTint, alignItems: "center", justifyContent: "center" }}>
      <Icon size={iconSize} color={C.orange} strokeWidth={2} />
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} hitSlop={8}
      style={{ width: 48, height: 28, borderRadius: 14, padding: 3, backgroundColor: value ? C.orange : C.borderStrong, alignItems: value ? "flex-end" : "flex-start" }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.white }} />
    </Pressable>
  );
}

/** Two-option pill switch (Login / Sign Up). */
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", padding: 4, borderRadius: R.md, backgroundColor: C.chip }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.key)}
            style={[{ flex: 1, height: 40, borderRadius: 9, alignItems: "center", justifyContent: "center" }, on && { backgroundColor: C.white, ...shadow.soft }]}>
            <Txt size={14} weight={on ? "bold" : "semibold"} color={on ? C.navy : C.muted}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
      <H2>{title}</H2>
      {action && <Pressable onPress={onAction} hitSlop={10}><Txt size={13} weight="semibold" color={C.orangeDark}>{action}</Txt></Pressable>}
    </View>
  );
}

/* ---------- States ---------- */
export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ padding: 40, alignItems: "center", gap: 10 }}>
      <ActivityIndicator color={C.orange} size="large" />
      {label && <Txt color={C.muted}>{label}</Txt>}
    </View>
  );
}
export function EmptyState({ icon: Icon, title, body, action, onAction }: { icon?: LucideIcon; title: string; body?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ padding: 32, alignItems: "center", gap: 10 }}>
      {Icon && <IconTile icon={Icon} size={56} iconSize={26} />}
      <Txt heading size={16} center>{title}</Txt>
      {body && <Txt size={13} color={C.muted} center lh={1.5}>{body}</Txt>}
      {action && <Button title={action} onPress={onAction} height={46} style={{ marginTop: 6, alignSelf: "stretch" }} />}
    </View>
  );
}
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ margin: 16, padding: 14, borderRadius: R.md, backgroundColor: C.dangerTint, gap: 8 }}>
      <Txt size={13} color={C.danger}>{message}</Txt>
      {onRetry && <Pressable onPress={onRetry}><Txt size={13} weight="bold" color={C.danger}>Try again</Txt></Pressable>}
    </View>
  );
}
export function Notice({ children, icon: Icon }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, padding: 14, borderRadius: R.md, backgroundColor: C.orangeTint, borderWidth: 1, borderColor: C.orangeBorder }}>
      {Icon && <Icon size={18} color={C.orangeDark} />}
      <Txt size={13} color={C.orangeDark} lh={1.45} style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}

export const s = StyleSheet.create({
  badge: { paddingHorizontal: 8, borderRadius: R.sm, flexDirection: "row", alignItems: "center" },
  badgeCount: { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: C.orange, borderWidth: 2, borderColor: C.white },
  select: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.white },
});
