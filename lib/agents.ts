import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NIGERIA_STATE_CITIES, NIGERIA_STATES } from "@/lib/constants";
import { isAgentKycApproved } from "@/lib/kyc";
import type { AgentProfile, HousingRequest } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const OPEN_REQUEST_STATUSES = ["pending", "matched"] as const;
const STATE_NAMES = new Set(NIGERIA_STATES.map(normalizeMatchValue));
const CITY_TO_STATES = Object.entries(NIGERIA_STATE_CITIES).reduce((map, [state, cities]) => {
  cities.forEach((city) => {
    const normalizedCity = normalizeMatchValue(city);
    const normalizedState = normalizeMatchValue(state);
    map.set(normalizedCity, [...(map.get(normalizedCity) ?? []), normalizedState]);
  });

  return map;
}, new Map<string, string[]>());

type MatchableAgent = Partial<
  Pick<
    AgentProfile,
    "agent_id" | "user_id" | "agent_plan" | "kyc_status" | "suspended" | "operating_locations" | "property_specialties"
  >
>;

type MatchableRequest = Pick<HousingRequest, "preferred_location" | "area" | "property_type">;

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

function normalizeMatchValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function createAgentLocationMatcher(locations?: string[] | null) {
  const states = new Set<string>();
  const areas = new Set<string>();
  const exact = new Set<string>();
  const addInferredStatesForArea = (area: string) => {
    CITY_TO_STATES.get(area)?.forEach((state) => states.add(state));
  };

  compactUnique(locations).forEach((location) => {
    const normalized = normalizeMatchValue(location);
    if (!normalized) return;

    exact.add(normalized);

    const [rawState, rawArea] = location.split(" - ").map((part) => normalizeMatchValue(part));
    if (rawArea) {
      if (STATE_NAMES.has(rawState)) states.add(rawState);
      areas.add(rawArea);
      return;
    }

    if (STATE_NAMES.has(rawState)) {
      states.add(rawState);
    } else {
      areas.add(rawState);
      addInferredStatesForArea(rawState);
    }
  });

  return { areas, exact, states };
}

export function requestMatchesAgent(request: MatchableRequest, agent?: MatchableAgent | null) {
  if (!isAgentKycApproved(agent)) return false;

  const specialties = new Set(compactUnique(agent?.property_specialties).map(normalizeMatchValue));
  if (!specialties.has(normalizeMatchValue(request.property_type))) return false;

  const locations = createAgentLocationMatcher(agent?.operating_locations);
  const preferredLocation = normalizeMatchValue(request.preferred_location);
  const area = normalizeMatchValue(request.area);

  return (
    locations.states.has(preferredLocation) ||
    locations.exact.has(preferredLocation) ||
    Boolean(area && (locations.areas.has(area) || locations.exact.has(area)))
  );
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

export async function getOpenMatchingRequestsForAgent(agent?: MatchableAgent | null) {
  if (!isAgentKycApproved(agent)) return [];

  const supabase = createAdminClient();
  const { data: requests, error } = await supabase
    .from("housing_requests")
    .select("*")
    .in("status", [...OPEN_REQUEST_STATUSES])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (requests ?? []).filter((request) => requestMatchesAgent(request, agent));
}

export async function matchAgentsForRequest(requestId: string, options: { notify?: boolean } = {}) {
  if (!requestId) return { matchedCount: 0, notifiedCount: 0 };

  const supabase = createAdminClient();
  const { data: request, error: requestError } = await supabase
    .from("housing_requests")
    .select("request_id, preferred_location, area, property_type, status")
    .eq("request_id", requestId)
    .single();

  if (requestError) throw requestError;
  if (!request) return { matchedCount: 0, notifiedCount: 0 };

  const { data: agents, error: agentsError } = await supabase
    .from("agent_profiles")
    .select("agent_id, user_id, kyc_status, suspended, operating_locations, property_specialties, agent_plan")
    .eq("kyc_status", "approved")
    .eq("suspended", false);

  if (agentsError) throw agentsError;

  const matchedAgents = (agents ?? []).filter((agent) => requestMatchesAgent(request, agent));
  const agentIds = compactUnique(matchedAgents.map((agent) => agent.agent_id));

  if (!agentIds.length) return { matchedCount: 0, notifiedCount: 0 };

  const { data: existingMatches, error: existingMatchesError } = await supabase
    .from("request_matches")
    .select("agent_id, notified_at")
    .eq("request_id", requestId)
    .in("agent_id", agentIds);

  if (existingMatchesError) throw existingMatchesError;

  const existingAgentIds = new Set(existingMatches?.map((match) => match.agent_id) ?? []);
  const unnotifiedAgentIds = new Set(
    existingMatches?.filter((match) => !match.notified_at).map((match) => match.agent_id) ?? []
  );
  const newAgents = matchedAgents.filter((agent) => !existingAgentIds.has(agent.agent_id));
  const now = new Date().toISOString();

  if (newAgents.length) {
    const { error: matchError } = await supabase.from("request_matches").upsert(
      newAgents.map((agent) => ({
        request_id: requestId,
        agent_id: agent.agent_id,
        notified_at: options.notify ? now : null
      })),
      { onConflict: "request_id,agent_id", ignoreDuplicates: true }
    );

    if (matchError) throw matchError;
  }

  if (request.status === "pending") {
    const { error: statusError } = await supabase
      .from("housing_requests")
      .update({ status: "matched" })
      .eq("request_id", requestId);

    if (statusError) throw statusError;
  }

  if (!options.notify) return { matchedCount: newAgents.length, notifiedCount: 0 };

  const newAgentIds = new Set(newAgents.map((agent) => agent.agent_id));
  const agentsToNotify = matchedAgents.filter(
    (agent) => newAgentIds.has(agent.agent_id) || unnotifiedAgentIds.has(agent.agent_id)
  );

  if (!agentsToNotify.length) return { matchedCount: newAgents.length, notifiedCount: 0 };

  const { error: notificationError } = await supabase.from("notifications").insert(
    agentsToNotify.map((agent) => {
      const notification = requestNotificationForPlan(agent.agent_plan);
      return {
        user_id: agent.user_id,
        type: notification.type,
        message: notification.message
      };
    })
  );

  if (notificationError) throw notificationError;

  const { error: notifiedAtError } = await supabase
    .from("request_matches")
    .update({ notified_at: now })
    .eq("request_id", requestId)
    .in(
      "agent_id",
      agentsToNotify.map((agent) => agent.agent_id)
    );

  if (notifiedAtError) throw notifiedAtError;

  return { matchedCount: newAgents.length, notifiedCount: agentsToNotify.length };
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
    .select("request_id, preferred_location, area, property_type")
    .in("status", [...OPEN_REQUEST_STATUSES]);

  if (requestsError) throw requestsError;

  const requestIds = compactUnique(
    requests?.filter((request) => requestMatchesAgent(request, agent)).map((request) => request.request_id)
  );
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
