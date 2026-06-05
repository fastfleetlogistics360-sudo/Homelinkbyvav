import { redirect } from "next/navigation";
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
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.account_type !== accountType) {
    redirect(profile?.account_type === "agent" ? "/dashboard/agent" : "/dashboard/seeker");
  }

  return user;
}

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data;
  } catch {
    return null;
  }
}
