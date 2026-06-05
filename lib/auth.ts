import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/types";

export async function getSessionUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireAccountType(accountType: AccountType) {
  const user = await requireUser();
  const profile = await ensureProfile(user);

  if (!profile || profile.account_type !== accountType) {
    redirect(profile?.account_type === "agent" ? "/dashboard/agent" : "/dashboard/seeker");
  }

  return user;
}

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  try {
    return await ensureProfile(user);
  } catch {
    return null;
  }
}

export async function ensureProfile(user: User) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const accountType =
    existing?.account_type ||
    (user.user_metadata?.account_type === "agent" || user.user_metadata?.account_type === "home_seeker"
      ? user.user_metadata.account_type
      : "home_seeker");
  const fullName = existing?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "HomeLink User";
  const email = existing?.email || user.email || `${user.id}@homelink.local`;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      account_type: accountType,
      full_name: fullName,
      email
    })
    .select("*")
    .single();

  if (accountType === "agent") {
    await admin
      .from("agent_profiles")
      .upsert(
        {
          user_id: user.id,
          full_name: fullName,
          agency_name: user.user_metadata?.agency_name || fullName,
          kyc_status: "pending",
          operating_locations: [],
          property_specialties: []
        },
        { onConflict: "user_id" }
      );
  } else {
    await admin
      .from("home_seeker_profiles")
      .upsert(
        {
          user_id: user.id,
          full_name: fullName
        },
        { onConflict: "user_id" }
      );
  }

  return profile;
}
