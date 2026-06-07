import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const OPEN_REQUEST_STATUSES = ["pending", "matched"] as const;

export async function getRefreshedAgentProfile(supabase: SupabaseServerClient, userId: string) {
  const { data: agent } = await supabase.from("agent_profiles").select("*").eq("user_id", userId).single();

  if (!agent?.agent_id) return agent;

  await supabase.rpc("reset_agent_weekly_quota", { target_agent_id: agent.agent_id });
  const { data: refreshedAgent } = await supabase.from("agent_profiles").select("*").eq("user_id", userId).single();
  return refreshedAgent ?? agent;
}

function compactUnique(values?: string[] | null) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

function requestNotificationForPlan(plan?: string | null) {
  if (plan === "platinum") {
    return {
      type: "new_housing_request_priority_sms_placeholder",
      message: "Priority request available. SMS placeholder queued for future provider."
    };
  }

  if (plan === "premium") {
    return {
      type: "new_housing_request_email",
      message: "New matching housing request is available. Email alert enabled."
    };
  }

  return {
    type: "new_housing_request",
    message: "New matching housing request is available."
  };
}

export async function matchOpenRequestsForAgent(agentId: string) {
  if (!agentId) return { matchedCount: 0 };

  const supabase = createAdminClient();
  const { data: agent, error: agentError } = await supabase
    .from("agent_profiles")
    .select("agent_id, user_id, kyc_status, suspended, operating_locations, property_specialties, agent_plan")
    .eq("agent_id", agentId)
    .single();

  if (agentError) throw agentError;
  if (!agent || agent.kyc_status !== "approved" || agent.suspended) return { matchedCount: 0 };

  const operatingLocations = compactUnique(agent.operating_locations);
  const propertySpecialties = compactUnique(agent.property_specialties);

  if (!operatingLocations.length || !propertySpecialties.length) return { matchedCount: 0 };

  const { data: requests, error: requestsError } = await supabase
    .from("housing_requests")
    .select("request_id")
    .in("preferred_location", operatingLocations)
    .in("property_type", propertySpecialties)
    .in("status", [...OPEN_REQUEST_STATUSES]);

  if (requestsError) throw requestsError;

  const requestIds = compactUnique(requests?.map((request) => request.request_id));
  if (!requestIds.length) return { matchedCount: 0 };

  const { data: existingMatches, error: existingMatchesError } = await supabase
    .from("request_matches")
    .select("request_id")
    .eq("agent_id", agentId)
    .in("request_id", requestIds);

  if (existingMatchesError) throw existingMatchesError;

  const existingRequestIds = new Set(existingMatches?.map((match) => match.request_id) ?? []);
  const newRequestIds = requestIds.filter((requestId) => !existingRequestIds.has(requestId));

  if (newRequestIds.length) {
    const now = new Date().toISOString();
    const { error: matchError } = await supabase.from("request_matches").upsert(
      newRequestIds.map((requestId) => ({
        request_id: requestId,
        agent_id: agentId,
        notified_at: now
      })),
      { onConflict: "request_id,agent_id", ignoreDuplicates: true }
    );

    if (matchError) throw matchError;

    const notification = requestNotificationForPlan(agent.agent_plan);
    const { error: notificationError } = await supabase.from("notifications").insert(
      newRequestIds.map(() => ({
        user_id: agent.user_id,
        type: notification.type,
        message: notification.message
      }))
    );

    if (notificationError) throw notificationError;
  }

  const { error: statusError } = await supabase
    .from("housing_requests")
    .update({ status: "matched" })
    .in("request_id", requestIds)
    .eq("status", "pending");

  if (statusError) throw statusError;

  return { matchedCount: newRequestIds.length };
}
