import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/domain";

export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, active")
    .eq("id", userId)
    .eq("active", true)
    .single();
  return (data as Profile | null) ?? null;
});

export async function requireProfile(allowed?: UserRole[]) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?message=Please%20sign%20in%20to%20continue.");
  if (allowed && !allowed.includes(profile.role)) redirect("/unauthorised");
  return profile;
}

export function dashboardAllowed(role: UserRole) {
  return role === "team_viewer" || role === "administrator";
}
