"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadAgentKycDocuments, uploadAgentProfilePhoto } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function saveAgentKycAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const operatingLocations = formData
    .getAll("operating_locations")
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);
  const propertySpecialties = formData
    .getAll("property_specialties")
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);
  const uniqueOperatingLocations = Array.from(new Set(operatingLocations));
  const uniquePropertySpecialties = Array.from(new Set(propertySpecialties));
  const termsAccepted = formData.get("terms_accepted") === "on";

  if (!termsAccepted) {
    redirect("/dashboard/agent/kyc?error=Please accept the HomeLink terms and condition to continue.");
  }

  if (!uniqueOperatingLocations.length) {
    redirect("/dashboard/agent/kyc?error=Select at least one operating state.");
  }

  if (!uniquePropertySpecialties.length) {
    redirect("/dashboard/agent/kyc?error=Select at least one property specialty.");
  }

  const existingDocuments = String(formData.get("existing_verification_documents") || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const uploadedDocuments = await uploadAgentKycDocuments(user.id, formData.getAll("verification_documents"));
  const uploadedPhoto = await uploadAgentProfilePhoto(user.id, formData.get("profile_photo_file"));
  const profilePhoto = uploadedPhoto || String(formData.get("existing_profile_photo") || "");
  const admin = createAdminClient();
  const { data: existingAgent } = await admin
    .from("agent_profiles")
    .select("kyc_status")
    .eq("user_id", user.id)
    .single();
  const nextKycStatus = existingAgent?.kyc_status === "approved" ? "approved" : "pending";

  const { error } = await admin
    .from("agent_profiles")
    .update({
      agency_name: String(formData.get("agency_name")),
      phone: String(formData.get("phone")),
      whatsapp: String(formData.get("whatsapp")),
      profile_photo: profilePhoto,
      verification_documents: [...existingDocuments, ...uploadedDocuments],
      operating_locations: uniqueOperatingLocations,
      property_specialties: uniquePropertySpecialties,
      kyc_status: nextKycStatus
    })
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/agent/kyc?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard/agent/kyc");
  redirect(nextKycStatus === "approved" ? "/dashboard/agent" : "/dashboard/agent/kyc?submitted=1");
}

export async function createRequestResponseAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("agent_id, kyc_status, suspended, agent_plan, weekly_request_limit, weekly_request_used, last_reset_date")
    .eq("user_id", user.id)
    .single();

  if (!agent || agent.kyc_status !== "approved" || agent.suspended) {
    redirect("/dashboard/agent/kyc");
  }

  await supabase.rpc("reset_agent_weekly_quota", { target_agent_id: agent.agent_id });
  const { data: canAccept } = await supabase.rpc("agent_can_accept_request", { target_agent_id: agent.agent_id });
  if (!canAccept) {
    redirect("/dashboard/agent/subscription?quota=exhausted");
  }

  const requestId = String(formData.get("request_id"));
  const { error } = await supabase.from("request_responses").insert({
    request_id: requestId,
    agent_id: agent.agent_id,
    message: String(formData.get("message")),
    property_title: String(formData.get("property_title")),
    property_location: String(formData.get("property_location")),
    property_price: String(formData.get("property_price")),
    property_images: String(formData.get("property_images") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    inspection_available: formData.get("inspection_available") === "on"
  });

  if (error) redirect(`/dashboard/agent/requests?error=${encodeURIComponent(error.message)}`);

  await supabase.rpc("increment_agent_weekly_usage", { target_agent_id: agent.agent_id });
  await supabase.from("housing_requests").update({ status: "accepted" }).eq("request_id", requestId);
  await supabase.rpc("create_conversation_for_response", { target_request_id: requestId, target_agent_id: agent.agent_id });

  revalidatePath("/dashboard/agent");
  redirect("/dashboard/agent");
}
