"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHousingRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: seeker } = await supabase
    .from("home_seeker_profiles")
    .select("home_seeker_id")
    .eq("user_id", user.id)
    .single();
  if (!seeker) redirect("/dashboard/seeker");

  const requestPayload = {
    home_seeker_id: seeker.home_seeker_id,
    preferred_location: String(formData.get("preferred_location")),
    area: String(formData.get("area") || ""),
    property_type: String(formData.get("property_type")),
    bedrooms: String(formData.get("bedrooms")),
    budget_min: Number(formData.get("budget_min")),
    budget_max: Number(formData.get("budget_max")),
    rent_duration: String(formData.get("rent_duration")),
    move_in_date: String(formData.get("move_in_date")),
    extra_notes: String(formData.get("extra_notes") || ""),
    status: "pending"
  };

  const { data: request, error } = await supabase
    .from("housing_requests")
    .insert(requestPayload)
    .select("request_id")
    .single();

  if (error) redirect(`/dashboard/seeker/requests/new?error=${encodeURIComponent(error.message)}`);

  await supabase.rpc("match_agents_for_request", { target_request_id: request.request_id });

  revalidatePath("/dashboard/seeker");
  redirect(`/api/paystack/initialize?request_id=${request.request_id}`);
}

export async function markRequestFulfilledAction(formData: FormData) {
  const supabase = await createClient();
  const requestId = String(formData.get("request_id"));
  await supabase.from("housing_requests").update({ status: "fulfilled" }).eq("request_id", requestId);
  revalidatePath("/dashboard/seeker");
}
