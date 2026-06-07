"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  account_type: z.enum(["home_seeker", "agent"]),
  full_name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().email(),
  phone: z.string().trim().min(7, "Enter your phone number."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include one uppercase letter.")
    .regex(/\d/, "Password must include one number.")
    .regex(/[^A-Za-z0-9]/, "Password must include one special character."),
  confirm_password: z.string(),
  agency_name: z.string().trim().optional(),
  preferred_locations: z.string().trim().optional(),
  budget_min: z.string().trim().optional(),
  budget_max: z.string().trim().optional(),
  move_in_date: z.string().trim().optional(),
  property_type: z.string().trim().optional(),
  bedrooms: z.string().trim().optional(),
  additional_notes: z.string().trim().max(500, "Additional notes must be 500 characters or fewer.").optional()
});

function redirectWithSignupError(message: string, accountType: "home_seeker" | "agent" = "home_seeker"): never {
  redirect(`/auth/signup?type=${accountType}&error=${encodeURIComponent(message)}`);
}

function parseBudget(value: string | undefined) {
  if (!value) return null;
  const amount = Number(value.replace(/[,\s]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function splitLocations(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((location) => location.trim())
    .filter(Boolean);
}

function validateSignupDetails(parsed: z.infer<typeof authSchema>) {
  if (parsed.password !== parsed.confirm_password) {
    return "Passwords must match.";
  }

  if (parsed.account_type === "agent") {
    return null;
  }

  const preferredLocations = splitLocations(parsed.preferred_locations);
  const budgetMin = parseBudget(parsed.budget_min);
  const budgetMax = parseBudget(parsed.budget_max);

  if (preferredLocations.length === 0) return "Enter at least one preferred location.";
  if (!budgetMin || budgetMin <= 0) return "Enter a valid minimum budget.";
  if (!budgetMax || budgetMax <= 0) return "Enter a valid maximum budget.";
  if (budgetMin > budgetMax) return "Maximum budget must be greater than minimum budget.";
  if (!parsed.move_in_date) return "Select your move-in date.";
  if (!parsed.property_type) return "Select what you are looking for.";
  if (!parsed.bedrooms) return "Select the number of bedrooms.";

  return null;
}

const verificationMessage =
  "Account created. Check your email to verify your account before logging in.";

const signupRedirectTargets = {
  agent: "/dashboard/agent/kyc",
  home_seeker: "/dashboard/seeker"
} as const;

const signupMetadataKeys = {
  agent: "agent_signup_details",
  home_seeker: "home_seeker_signup_details"
} as const;

export async function signUpAction(formData: FormData) {
  const rawAccountType = formData.get("account_type");
  const errorAccountType = rawAccountType === "agent" ? "agent" : "home_seeker";
  const result = authSchema.safeParse({
    account_type: formData.get("account_type"),
    full_name: String(formData.get("full_name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    password: String(formData.get("password") || ""),
    confirm_password: String(formData.get("confirm_password") || ""),
    agency_name: String(formData.get("agency_name") || "") || undefined,
    preferred_locations: String(formData.get("preferred_locations") || "") || undefined,
    budget_min: String(formData.get("budget_min") || "") || undefined,
    budget_max: String(formData.get("budget_max") || "") || undefined,
    move_in_date: String(formData.get("move_in_date") || "") || undefined,
    property_type: String(formData.get("property_type") || "") || undefined,
    bedrooms: String(formData.get("bedrooms") || "") || undefined,
    additional_notes: String(formData.get("additional_notes") || "") || undefined
  });
  if (!result.success) {
    redirectWithSignupError(result.error.issues[0]?.message || "Please check your signup details.", errorAccountType);
  }

  const parsed = result.data;
  const validationError = validateSignupDetails(parsed);
  if (validationError) redirectWithSignupError(validationError, parsed.account_type);

  const preferredLocations = splitLocations(parsed.preferred_locations);
  const budgetMin = parseBudget(parsed.budget_min);
  const budgetMax = parseBudget(parsed.budget_max);

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://homelinkbyvav.vercel.app";
  const nextPath = signupRedirectTargets[parsed.account_type];
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: {
        account_type: parsed.account_type,
        full_name: parsed.full_name,
        phone: parsed.phone,
        agency_name: parsed.agency_name || "",
        preferred_locations: preferredLocations,
        [signupMetadataKeys[parsed.account_type]]:
          parsed.account_type === "home_seeker"
            ? {
                additional_notes: parsed.additional_notes || "",
                bedrooms: parsed.bedrooms || "",
                budget_max: budgetMax,
                budget_min: budgetMin,
                move_in_date: parsed.move_in_date || "",
                property_type: parsed.property_type || ""
              }
            : {
                agency_name: parsed.agency_name || ""
              }
      }
    }
  });

  if (error) redirectWithSignupError(error.message, parsed.account_type);
  if (!data.user) redirect(`/auth/login?message=${encodeURIComponent(verificationMessage)}`);

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
          full_name: parsed.full_name,
          phone: parsed.phone,
          preferred_locations: preferredLocations
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
          phone: parsed.phone
        },
        { onConflict: "user_id" }
      );
  }

  revalidatePath("/", "layout");
  redirect(`/auth/login?message=${encodeURIComponent(verificationMessage)}`);
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

export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/?account=deleted");
}
