// 06 · Vendor details
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Briefcase, ChevronLeft, FileText, Heart, Mail, MapPin, MessageSquare, Phone, Share, Star, X } from "lucide-react-native";
import { C, R, shadow } from "@/theme";
import { Badge, Button, Card, ErrorBox, Field, H2, Initial, Loading, SectionTitle, Txt } from "@/components/ui";
import { callNumber, emailTo, HERO, MiniVendor, shareListing } from "@/components/brand";
import { getListing } from "@/lib/listings";
import { getListingReviews, submitLead, submitReview } from "@/lib/messaging";
import { getSaved, toggleSaved } from "@/lib/local";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { subLabel } from "@/lib/adFields";

const W = Dimensions.get("window").width;

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, displayName, profile } = useAuth();
  const q = useQuery({ queryKey: ["listing", id], queryFn: () => getListing(id!), enabled: !!id });
  const reviews = useQuery({ queryKey: ["reviews", id], queryFn: () => getListingReviews(id!), enabled: !!id });
  const portfolio = useQuery({
    queryKey: ["portfolio", id], enabled: !!id,
    queryFn: async () => (await supabase.from("portfolio_files").select("id,name,file_path").eq("listing_id", id!)).data ?? [],
  });
  const [photo, setPhoto] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", requirement: "" });

  useEffect(() => { getSaved().then((s) => setSaved(s.some((x) => x.id === id))); }, [id]);
  useEffect(() => { if (user) setLead((l) => ({ ...l, name: l.name || displayName, phone: l.phone || profile?.phone || "" })); }, [user, displayName, profile]);

  const leadM = useMutation({
    mutationFn: () => submitLead({ listingId: id!, vendorId: q.data!.listing.vendorId, ...lead }),
    onSuccess: () => { Alert.alert("Request sent", "The vendor will contact you shortly."); setLead((l) => ({ ...l, requirement: "" })); },
    onError: (e: Error) => Alert.alert("Couldn't send", e.message),
  });

  if (q.isLoading) return <View style={{ flex: 1, paddingTop: insets.top }}><Loading /></View>;
  if (q.error || !q.data) return <View style={{ flex: 1, paddingTop: insets.top }}><ErrorBox message={(q.error as Error)?.message ?? "Not found"} onRetry={() => q.refetch()} /></View>;

  const { listing: l, similar } = q.data;
  const photos = l.images.length ? l.images : [];
  const message = () => router.push({ pathname: "/chat/[listingId]", params: { listingId: l.id } });
  const save = async () => setSaved(await toggleSaved({ id: l.id, name: l.name, categoryLabel: l.categoryLabel, city: l.city, rating: l.rating }));
  const openPortfolio = async () => {
    const files = portfolio.data ?? [];
    if (!files.length) return Alert.alert("No portfolio yet", "This vendor hasn't uploaded a portfolio. Check the gallery below.");
    const { data } = await supabase.storage.from("portfolios").createSignedUrl(files[0].file_path, 600);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
    else Alert.alert("Portfolio unavailable", "Couldn't open the file right now.");
  };
  const sub = l.subcategory ? subLabel(l.category, l.subcategory) : "";
  const specs = Object.entries(l.attributes).filter(([k]) => k !== "experience");

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Photo header */}
        <View style={{ height: 230 + insets.top }}>
          {photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / W))}>
              {photos.map((u, i) => (
                <Pressable key={u + i} onPress={() => setViewer(i)}>
                  <Image source={{ uri: u }} style={{ width: W, height: 230 + insets.top }} contentFit="cover" accessibilityLabel={`Photo ${i + 1} of ${l.name}`} />
                </Pressable>
              ))}
            </ScrollView>
          ) : <Image source={HERO} style={{ width: W, height: 230 + insets.top }} contentFit="cover" accessibilityLabel="" />}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
            <Defs><LinearGradient id="top" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.navy} stopOpacity={0.45} /><Stop offset="0.45" stopColor={C.navy} stopOpacity={0} /></LinearGradient></Defs>
            <Rect width="100%" height="100%" fill="url(#top)" />
          </Svg>
          <View style={{ position: "absolute", top: insets.top + 14, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" }}>
            <RoundBtn icon={ChevronLeft} label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/search"))} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <RoundBtn icon={Share} label="Share" onPress={() => shareListing(l)} />
              <RoundBtn icon={Heart} label={saved ? "Remove from saved" : "Save vendor"} onPress={save} filled={saved} />
            </View>
          </View>
          {photos.length > 1 && (
            <View style={{ position: "absolute", right: 14, bottom: 34, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: "rgba(13,43,69,0.75)", justifyContent: "center" }}>
              <Txt size={12} weight="semibold" color={C.white}>{photo + 1} / {photos.length} photos</Txt>
            </View>
          )}
        </View>

        {/* Summary card */}
        <View style={[st.summary, shadow.card]}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Initial name={l.name} size={56} />
            <View style={{ flex: 1 }}>
              <Txt heading="xb" size={19} lh={1.25}>{l.name}</Txt>
              <Txt size={13} color={C.muted} style={{ marginTop: 3 }}>{l.categoryLabel}{sub ? ` · ${sub}` : ""}</Txt>
            </View>
          </View>
          <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <View style={{ height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: C.navyTint, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Star size={12} color={C.orange} fill={C.orange} />
              <Txt size={12} weight="bold">{l.rating.toFixed(1)} <Txt size={12} weight="medium" color={C.muted}>({l.reviews})</Txt></Txt>
            </View>
            {l.verified && <Badge kind="verified" h={26} />}
            {l.topRated && <Badge kind="top" h={26} />}
            <Badge kind="neutral" h={26} label={`${l.experience} yrs exp`} />
          </View>
          <View style={{ marginTop: 12, gap: 7 }}>
            <Line icon={MapPin} text={l.location} />
            {l.contactPhone && <Line icon={Phone} text={l.contactPhone} onPress={() => callNumber(l.contactPhone)} />}
            {l.contactEmail && <Line icon={Mail} text={l.contactEmail} onPress={() => emailTo(l.contactEmail, `Enquiry via BharathBuild: ${l.name}`)} />}
          </View>
          <View style={{ marginTop: 14, flexDirection: "row", gap: 8 }}>
            <Action icon={Phone} label="Call Now" primary onPress={() => callNumber(l.contactPhone)} />
            <Action icon={MessageSquare} label="Message" onPress={message} />
            <Action icon={Briefcase} label="Portfolio" onPress={openPortfolio} />
          </View>
        </View>

        {/* About + services + specs */}
        <Card style={st.section}>
          <H2 style={{ marginBottom: 6 }}>About</H2>
          <Txt size={13} lh={1.55} color={C.body}>{l.description}</Txt>
          {l.tags.length > 0 && <>
            <H2 style={{ marginTop: 16, marginBottom: 8 }}>Services</H2>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {l.tags.map((t) => <View key={t} style={st.pill}><Txt size={12} weight="semibold">{t}</Txt></View>)}
            </View>
          </>}
          {specs.length > 0 && <>
            <H2 style={{ marginTop: 16, marginBottom: 8 }}>Specifications</H2>
            {specs.map(([k, v]) => (
              <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.divider }}>
                <Txt size={13} color={C.muted} style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</Txt>
                <Txt size={13} weight="semibold">{k === "price" || k === "salary" ? `₹${v}` : v}</Txt>
              </View>
            ))}
          </>}
        </Card>

        {/* Gallery */}
        {photos.length > 0 && (
          <Card style={st.section}>
            <SectionTitle title="Gallery" action="View all" onAction={() => setViewer(0)} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {photos.slice(0, 3).map((u, i) => (
                <Pressable key={u + i} style={{ flex: 1, height: 92, borderRadius: 10, overflow: "hidden" }} onPress={() => setViewer(i)} accessibilityLabel={`Open photo ${i + 1}`}>
                  <Image source={{ uri: u }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  {i === 2 && photos.length > 3 && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(13,43,69,0.6)", alignItems: "center", justifyContent: "center" }]}>
                      <Txt size={15} weight="bold" color={C.white}>+{photos.length - 3}</Txt>
                    </View>
                  )}
                </Pressable>
              ))}
              {photos.length < 3 && Array.from({ length: 3 - photos.length }).map((_, i) => <View key={i} style={{ flex: 1 }} />)}
            </View>
          </Card>
        )}

        {/* Reviews */}
        <Card style={st.section}>
          <SectionTitle title="Reviews" action="Write a review" onAction={() => (user ? setReviewOpen(true) : router.push({ pathname: "/login", params: { next: `/listing/${l.id}` } }))} />
          {(reviews.data ?? []).length === 0 && <Txt size={13} color={C.muted} style={{ paddingVertical: 8 }}>No reviews yet. Be the first to share your experience.</Txt>}
          {(reviews.data ?? []).slice(0, 5).map((r, i) => (
            <View key={r.id} style={{ paddingVertical: 12, borderBottomWidth: i < Math.min(5, reviews.data!.length) - 1 ? 1 : 0, borderBottomColor: C.divider }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Initial name={r.customer_name} size={32} round dark />
                <Txt weight="bold" style={{ flex: 1 }}>{r.customer_name}</Txt>
                <Txt size={13} weight="bold" color={C.orangeDark}>★ {Number(r.rating).toFixed(1)}</Txt>
              </View>
              {!!r.body && <Txt size={13} lh={1.5} color={C.body} style={{ marginTop: 8 }}>{r.body}</Txt>}
            </View>
          ))}
        </Card>

        {/* Request a quote */}
        <Card style={st.section}>
          <H2>Request a quote</H2>
          <Txt size={13} color={C.muted} style={{ marginTop: 4, marginBottom: 12 }}>Share your requirement and the vendor will reach out.</Txt>
          <View style={{ gap: 8 }}>
            <Field accessibilityLabel="Your name" placeholder="Your name" value={lead.name} onChangeText={(v) => setLead({ ...lead, name: v })} autoComplete="name" />
            <Field accessibilityLabel="Phone" placeholder="Phone number" value={lead.phone} onChangeText={(v) => setLead({ ...lead, phone: v })} keyboardType="phone-pad" autoComplete="tel" />
            <Field accessibilityLabel="Requirement" placeholder="Briefly describe your project" value={lead.requirement} onChangeText={(v) => setLead({ ...lead, requirement: v })} multiline maxLength={500} />
            <Button title="Submit" variant="navy" height={48} loading={leadM.isPending} onPress={() => leadM.mutate()} />
          </View>
        </Card>

        {/* Similar */}
        {similar.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <H2 style={{ marginBottom: 10, paddingHorizontal: 16 }}>Similar vendors</H2>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {similar.map((s) => <MiniVendor key={s.id} l={s} />)}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky actions */}
      <View style={[st.bottom, shadow.card, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <Button title="Message" icon={MessageSquare} variant="outlineNavy" style={{ flex: 1 }} onPress={message} />
        <Button title="Call Now" icon={Phone} style={{ flex: 1.3 }} onPress={() => callNumber(l.contactPhone)} />
      </View>

      {/* Full-screen photo viewer */}
      <Modal visible={viewer !== null} animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <ScrollView horizontal pagingEnabled contentOffset={{ x: (viewer ?? 0) * W, y: 0 }}>
            {photos.map((u, i) => <Image key={u + i} source={{ uri: u }} style={{ width: W, height: "100%" }} contentFit="contain" />)}
          </ScrollView>
          <View style={{ position: "absolute", top: insets.top + 12, right: 12 }}>
            <RoundBtn icon={X} label="Close photos" onPress={() => setViewer(null)} />
          </View>
        </View>
      </Modal>

      <ReviewModal visible={reviewOpen} onClose={() => setReviewOpen(false)} listingId={l.id} vendorId={l.vendorId} name={displayName} onDone={() => reviews.refetch()} />
    </View>
  );
}

function RoundBtn({ icon: Icon, label, onPress, filled }: { icon: typeof X; label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.94)", alignItems: "center", justifyContent: "center" }}>
      <Icon size={19} color={filled ? C.orange : C.navy} fill={filled ? C.orange : "transparent"} strokeWidth={2.2} />
    </Pressable>
  );
}
function Line({ icon: Icon, text, onPress }: { icon: typeof X; text: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Icon size={15} color={C.muted} />
      <Txt size={13} color={C.body} style={{ flex: 1 }}>{text}</Txt>
    </Pressable>
  );
}
function Action({ icon: Icon, label, onPress, primary }: { icon: typeof X; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ flex: 1, height: 64, borderRadius: R.md, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: primary ? C.orangeTint : C.navyTint }, pressed && { opacity: 0.8 }]}>
      <Icon size={20} color={primary ? C.orange : C.navy} />
      <Txt size={12} weight="bold" color={primary ? C.orangeDark : C.navy}>{label}</Txt>
    </Pressable>
  );
}

function ReviewModal({ visible, onClose, listingId, vendorId, name, onDone }: { visible: boolean; onClose: () => void; listingId: string; vendorId: string; name: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const m = useMutation({
    mutationFn: () => submitReview({ listingId, vendorId, name, rating, body }),
    onSuccess: () => { setBody(""); onClose(); onDone(); Alert.alert("Thanks!", "Your review has been posted."); },
    onError: (e: Error) => Alert.alert("Couldn't post review", e.message),
  });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: C.overlay }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: insets.bottom + 16, gap: 14 }}>
        <Txt heading size={18}>Write a review</Txt>
        <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="adjustable" accessibilityLabel={`Rating ${rating} of 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setRating(i)} accessibilityLabel={`${i} star${i > 1 ? "s" : ""}`} hitSlop={6}>
              <Star size={34} color={C.orange} fill={i <= rating ? C.orange : "transparent"} />
            </Pressable>
          ))}
        </View>
        <Field placeholder="What was your experience like?" value={body} onChangeText={setBody} multiline maxLength={800} />
        <Button title="Post review" loading={m.isPending} onPress={() => m.mutate()} />
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  summary: { marginTop: -22, marginHorizontal: 16, padding: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: R.xl },
  section: { marginTop: 14, marginHorizontal: 16 },
  pill: { height: 30, paddingHorizontal: 11, borderRadius: 15, backgroundColor: C.chip, justifyContent: "center" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 16, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", gap: 10 },
});
