"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveAgentKycAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const operatingLocations = String(formData.get("operating_locations") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const propertySpecialties = String(formData.get("property_specialties") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  await supabase
    .from("agent_profiles")
    .update({
      agency_name: String(formData.get("agency_name")),
      phone: String(formData.get("phone")),
      whatsapp: String(formData.get("whatsapp")),
      profile_photo: String(formData.get("profile_photo") || ""),
      verification_documents: String(formData.get("verification_documents") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      operating_locations: operatingLocations,
      property_specialties: propertySpecialties,
      kyc_status: "pending"
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/agent");
  redirect("/dashboard/agent");
}

export async function createRequestResponseAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("agent_id, kyc_status, suspended")
    .eq("user_id", user.id)
    .single();

  if (!agent || agent.kyc_status !== "approved" || agent.suspended) {
    redirect("/dashboard/agent/kyc");
  }

  const requestId = String(formData.get("request_id"));
  await supabase.from("request_responses").insert({
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

  await supabase.from("housing_requests").update({ status: "accepted" }).eq("request_id", requestId);
  await supabase.rpc("create_conversation_for_response", { target_request_id: requestId, target_agent_id: agent.agent_id });

  revalidatePath("/dashboard/agent");
  redirect("/dashboard/agent");
}
