"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  account_type: z.enum(["home_seeker", "agent"]),
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  agency_name: z.string().optional()
});

export async function signUpAction(formData: FormData) {
  const parsed = authSchema.parse({
    account_type: formData.get("account_type"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    agency_name: formData.get("agency_name") || undefined
  });

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://homelinkbyvav.vercel.app";
  const nextPath = parsed.account_type === "agent" ? "/dashboard/agent/kyc" : "/dashboard/seeker";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: {
        account_type: parsed.account_type,
        full_name: parsed.full_name,
        agency_name: parsed.agency_name || ""
      }
    }
  });

  if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  if (!data.user) redirect("/auth/login?message=Check your email to confirm your account.");

  const admin = createAdminClient();
  await admin.from("profiles").upsert({
    id: data.user.id,
    account_type: parsed.account_type,
    full_name: parsed.full_name,
    email: parsed.email
  });

  if (parsed.account_type === "home_seeker") {
    await admin
      .from("home_seeker_profiles")
      .upsert(
        {
          user_id: data.user.id,
          full_name: parsed.full_name
        },
        { onConflict: "user_id" }
      );
  } else {
    await admin
      .from("agent_profiles")
      .upsert(
        {
          user_id: data.user.id,
          full_name: parsed.full_name,
          agency_name: parsed.agency_name || parsed.full_name,
          kyc_status: "pending",
          operating_locations: [],
          property_specialties: []
        },
        { onConflict: "user_id" }
      );
  }

  revalidatePath("/", "layout");
  redirect(parsed.account_type === "agent" ? "/dashboard/agent/kyc" : "/dashboard/seeker");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);

  const profile = data.user ? await ensureProfile(data.user) : null;
  revalidatePath("/", "layout");
  redirect(profile?.account_type === "agent" ? "/dashboard/agent" : "/dashboard/seeker");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
