import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null, supabase };
}

export async function requireCustomer() {
  const session = await getSessionUser();
  if (!session.user) {
    return { ...session, error: "Sign in to continue." as const };
  }
  if (session.profile?.role === "admin") {
    return { ...session, error: "Use the admin console for staff accounts." as const };
  }
  return { ...session, error: null };
}

export async function requireAdmin() {
  const session = await getSessionUser();
  if (!session.user || session.profile?.role !== "admin") {
    return { ...session, authorized: false as const };
  }
  return { ...session, authorized: true as const };
}
