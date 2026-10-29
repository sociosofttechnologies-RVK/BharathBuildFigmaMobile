import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { DEMO, demoSession } from "@/lib/demo";

export type AppRole = "customer" | "vendor" | "admin" | "super_admin";
export type Profile = { full_name: string; phone: string | null; account_type: "customer" | "vendor"; is_approved: boolean };

type Ctx = {
  session: Session | null; user: User | null; roles: AppRole[]; profile: Profile | null;
  isAdmin: boolean; isVendor: boolean; loading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid?: string) => {
    if (!uid) { setRoles([]); setProfile(null); return; }
    const [r, p] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("full_name,phone,account_type,is_approved").eq("id", uid).maybeSingle(),
    ]);
    setRoles((r.data ?? []).map((x) => x.role as AppRole));
    setProfile((p.data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    if (DEMO) {
      setSession(demoSession as unknown as Session);
      load(demoSession.user.id).finally(() => setLoading(false));
      return;
    }
    supabase.auth.getSession()
      .then(async ({ data }) => { setSession(data.session); await load(data.session?.user?.id); })
      .catch(() => { /* offline or storage problem: continue signed out */ })
      .finally(() => setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      // defer: don't await Supabase calls inside the auth callback
      setTimeout(() => { load(s?.user?.id).catch(() => {}); }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const user = session?.user ?? null;
  const meta = (user?.user_metadata ?? {}) as { full_name?: string };
  const value: Ctx = {
    session, user, roles, profile, loading,
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isVendor: roles.includes("vendor"),
    displayName: profile?.full_name || meta.full_name || user?.email?.split("@")[0] || user?.phone || "Guest",
    signOut: async () => { await supabase.auth.signOut(); },
    refresh: async () => {
      const { data } = await supabase.auth.refreshSession();
      if (data.session) setSession(data.session);
      await load(data.session?.user?.id ?? user?.id);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
