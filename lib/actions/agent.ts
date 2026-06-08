"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { matchOpenRequestsForAgent } from "@/lib/agents";
import { uploadAgentKycDocuments, uploadAgentProfilePhoto } from "@/lib/storage";
import { isAgentKycApproved } from "@/lib/kyc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function ensureAgentWeeklyUsageIncrement({
  agentId,
  supabase,
  usedBefore
}: {
  agentId: string;
  supabase: SupabaseServerClient;
  usedBefore: number;
}) {
  const { error: incrementError } = await supabase.rpc("increment_agent_weekly_usage", { target_agent_id: agentId });

  const { data: quotaAfter } = await supabase
    .from("agent_profiles")
    .select("agent_plan, weekly_request_used")
    .eq("agent_id", agentId)
    .single();
  const usedAfter = Number(quotaAfter?.weekly_request_used || 0);
  if (!incrementError && usedAfter > usedBefore) return;

  if (incrementError) {
    console.error("Agent weekly usage RPC failed; applying fallback update.", incrementError);
  }

  const admin = createAdminClient();
  const { error: fallbackError } = await admin
    .from("agent_profiles")
    .update({ weekly_request_used: usedBefore + 1 })
    .eq("agent_id", agentId);

  if (fallbackError) {
    throw fallbackError;
  }
}

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
  let uploadedDocuments: string[] = [];
  let uploadedPhoto: string | null = null;

  try {
    uploadedDocuments = await uploadAgentKycDocuments(user.id, formData.getAll("verification_documents"));
    uploadedPhoto = await uploadAgentProfilePhoto(user.id, formData.get("profile_photo_file"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload KYC files.";
    redirect(`/dashboard/agent/kyc?error=${encodeURIComponent(message)}`);
  }

  const userMetadata = user.user_metadata as Record<string, unknown>;
  const fallbackName = String(formData.get("full_name") || userMetadata.full_name || user.email?.split("@")[0] || "Agent").trim();
  const fallbackPhone = String(formData.get("phone") || userMetadata.phone || "").trim();
  const fallbackAgency = String(formData.get("agency_name") || fallbackName).trim();
  const profilePhoto = uploadedPhoto || String(formData.get("existing_profile_photo") || "");
  let { data: existingAgent } = await supabase
    .from("agent_profiles")
    .select("agent_id, kyc_status, suspended, terms_accepted_at, agency_name, phone, whatsapp")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingAgent?.agent_id) {
    const admin = createAdminClient();
    const { data: ensuredAgent, error: ensureError } = await admin
      .from("agent_profiles")
      .upsert(
        {
          user_id: user.id,
          full_name: fallbackName,
          agency_name: fallbackAgency,
          phone: fallbackPhone
        },
        { onConflict: "user_id" }
      )
      .select("agent_id, kyc_status, suspended, terms_accepted_at, agency_name, phone, whatsapp")
      .single();

    if (ensureError) {
      redirect(`/dashboard/agent/kyc?error=${encodeURIComponent(ensureError.message)}`);
    }

    existingAgent = ensuredAgent;
  }

  const nextKycStatus = isAgentKycApproved(existingAgent) ? "approved" : "pending";
  const termsAcceptedAt = existingAgent?.terms_accepted_at || new Date().toISOString();
  const agencyName = String(formData.get("agency_name") || existingAgent?.agency_name || fallbackAgency).trim();
  const phone = String(formData.get("phone") || existingAgent?.phone || fallbackPhone).trim();
  const whatsapp = String(formData.get("whatsapp") || existingAgent?.whatsapp || phone).trim();

  const { error } = await supabase
    .from("agent_profiles")
    .update({
      agency_name: agencyName,
      phone,
      whatsapp,
      profile_photo: profilePhoto,
      verification_documents: [...existingDocuments, ...uploadedDocuments],
      operating_locations: uniqueOperatingLocations,
      property_specialties: uniquePropertySpecialties,
      terms_accepted_at: termsAcceptedAt,
      kyc_status: nextKycStatus
    })
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/agent/kyc?error=${encodeURIComponent(error.message)}`);
  }

  if (nextKycStatus === "approved" && existingAgent?.agent_id) {
    try {
      await matchOpenRequestsForAgent(existingAgent.agent_id);
    } catch (syncError) {
      console.error("KYC saved, but matching request sync failed.", syncError);
    }
  }

  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard/agent/kyc");
  revalidatePath("/dashboard/agent/requests");
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

  if (!agent || !isAgentKycApproved(agent)) {
    redirect("/dashboard/agent/kyc");
  }
  const agentId = agent.agent_id;

  await supabase.rpc("reset_agent_weekly_quota", { target_agent_id: agentId });
  const { data: quotaBefore } = await supabase
    .from("agent_profiles")
    .select("agent_plan, weekly_request_used")
    .eq("agent_id", agentId)
    .single();
  const usedBefore = Number(quotaBefore?.weekly_request_used ?? agent.weekly_request_used ?? 0);
  const { data: canAccept } = await supabase.rpc("agent_can_accept_request", { target_agent_id: agentId });
  if (!canAccept) {
    redirect("/dashboard/agent/subscription?quota=exhausted");
  }

  const requestId = String(formData.get("request_id"));
  const { error } = await supabase.from("request_responses").insert({
    request_id: requestId,
    agent_id: agentId,
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

  try {
    await ensureAgentWeeklyUsageIncrement({ agentId, supabase, usedBefore });
  } catch (usageError) {
    const message = usageError instanceof Error ? usageError.message : "Unable to update subscription usage.";
    redirect(`/dashboard/agent/requests?error=${encodeURIComponent(message)}`);
  }
  await supabase.from("housing_requests").update({ status: "accepted" }).eq("request_id", requestId);
  await supabase.rpc("create_conversation_for_response", { target_request_id: requestId, target_agent_id: agentId });

  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard/agent/requests");
  revalidatePath("/dashboard/agent/subscription");
  revalidatePath("/dashboard/agent/profile");
  redirect("/dashboard/agent");
}

export async function sendAgentMessageAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const message = String(formData.get("message") || "").trim();
  const requestId = String(formData.get("request_id") || "");
  const conversationId = String(formData.get("conversation_id") || "");

  if (!message || !requestId) {
    redirect("/dashboard/agent/matches");
  }

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("agent_id, kyc_status, suspended")
    .eq("user_id", user.id)
    .single();

  if (!agent || !isAgentKycApproved(agent)) {
    redirect("/dashboard/agent/kyc");
  }

  const { data: response } = await supabase
    .from("request_responses")
    .select("response_id")
    .eq("request_id", requestId)
    .eq("agent_id", agent.agent_id)
    .maybeSingle();

  if (!response) {
    redirect("/dashboard/agent/matches");
  }

  let conversationQuery = supabase
    .from("conversations")
    .select("conversation_id, request_id, home_seeker_user_id, agent_user_id")
    .eq("request_id", requestId)
    .eq("agent_user_id", user.id);

  if (conversationId) {
    conversationQuery = conversationQuery.eq("conversation_id", conversationId);
  }

  let { data: conversation } = await conversationQuery.maybeSingle();

  if (!conversation) {
    await supabase.rpc("create_conversation_for_response", { target_request_id: requestId, target_agent_id: agent.agent_id });
    const { data: createdConversation } = await supabase
      .from("conversations")
      .select("conversation_id, request_id, home_seeker_user_id, agent_user_id")
      .eq("request_id", requestId)
      .eq("agent_user_id", user.id)
      .maybeSingle();
    conversation = createdConversation;
  }

  if (!conversation) {
    redirect("/dashboard/agent/matches");
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversation.conversation_id,
    sender_id: user.id,
    receiver_id: conversation.home_seeker_user_id,
    request_id: requestId,
    message
  });

  if (error) {
    redirect(`/dashboard/agent/matches?chat_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard/agent/matches");
  redirect("/dashboard/agent/matches");
}
