// "Become a Business" application. Marks the profile as a vendor account awaiting approval and keeps the
// business details on the auth user's metadata so the admin panel / server functions can read them.
// An admin still grants the "vendor" role (user_roles is not writable from the client).
import { supabase } from "@/lib/supabase";

export const BUSINESS_TYPES = ["Proprietorship", "Partnership", "Private Limited", "LLP", "Freelancer / Individual"];

export type BusinessForm = {
  businessName: string; category: string; businessType: string; experience: string; services: string; description: string;
  phone: string; email: string; website: string; city: string; pincode: string; gst: string;
};

export function validateBusiness(f: BusinessForm): Partial<Record<keyof BusinessForm, string>> {
  const e: Partial<Record<keyof BusinessForm, string>> = {};
  if (f.businessName.trim().length < 2) e.businessName = "Enter your business name";
  if (!f.category) e.category = "Pick a category";
  if (!f.businessType) e.businessType = "Pick a business type";
  if (f.experience && !/^\d{1,2}$/.test(f.experience.trim())) e.experience = "Years as a number";
  if (!/^\+?\d{10,13}$/.test(f.phone.replace(/\s+/g, ""))) e.phone = "Enter a valid phone number";
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (!f.city.trim()) e.city = "Enter your city";
  if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "6-digit pincode";
  if (f.gst && !/^[0-9A-Z]{15}$/.test(f.gst.trim().toUpperCase())) e.gst = "GSTIN is 15 characters";
  return e;
}

export async function submitBusinessApplication(uid: string, f: BusinessForm) {
  const business = {
    ...f,
    gst: f.gst.trim().toUpperCase(),
    services: f.services.split(",").map((x) => x.trim()).filter(Boolean),
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  const { error: e1 } = await supabase.auth.updateUser({ data: { business } });
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase.from("profiles").update({ account_type: "vendor", phone: f.phone.trim(), is_approved: false }).eq("id", uid);
  if (e2) throw new Error(e2.message);
}

export function businessStatus(meta: Record<string, unknown> | undefined): "none" | "pending" {
  const b = meta?.business as { status?: string } | undefined;
  return b?.status === "pending" ? "pending" : "none";
}
