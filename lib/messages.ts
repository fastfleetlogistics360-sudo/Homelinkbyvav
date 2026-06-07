import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountType, RequestStatus, ResponseStatus } from "@/lib/types";

export type DashboardMessage = {
  message_id: string;
  conversation_id: string | null;
  sender_id: string;
  receiver_id: string;
  request_id: string;
  message: string;
  read_status: "read" | "unread" | string;
  created_at: string;
};

export type DashboardConversation = {
  conversation_id: string;
  request_id: string;
  home_seeker_user_id: string;
  agent_user_id: string;
  counterpart_name: string;
  counterpart_phone: string | null;
  counterpart_role: AccountType;
  property_title: string;
  property_location: string;
  property_price: string;
  property_images: string[];
  property_type: string;
  bedrooms: string;
  budget_min: number;
  budget_max: number;
  rent_duration: string;
  move_in_date: string;
  extra_notes: string | null;
  request_status: RequestStatus;
  response_status: ResponseStatus | null;
  initial_message: string | null;
  created_at: string;
  messages: DashboardMessage[];
};

type RawConversation = {
  conversation_id: string;
  request_id: string;
  home_seeker_user_id: string;
  agent_user_id: string;
  created_at: string;
  housing_requests?: {
    request_id: string;
    preferred_location: string;
    area: string | null;
    property_type: string;
    bedrooms: string;
    budget_min: number | string;
    budget_max: number | string;
    rent_duration: string;
    move_in_date: string;
    extra_notes: string | null;
    status: RequestStatus;
  } | null;
  messages?: DashboardMessage[] | null;
};

type SeekerProfile = {
  home_seeker_id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
};

type AgentProfile = {
  agent_id: string;
  user_id: string;
  full_name: string;
  agency_name: string;
  phone: string | null;
  whatsapp: string | null;
  profile_photo: string | null;
};

type RequestResponse = {
  response_id: string;
  request_id: string;
  agent_id: string;
  message: string;
  property_title: string;
  property_location: string;
  property_price: string;
  property_images: string[] | null;
  inspection_available: boolean;
  status: ResponseStatus;
  created_at: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function fallbackTitle(request: RawConversation["housing_requests"], response?: RequestResponse) {
  const location = request?.area || request?.preferred_location || response?.property_location || "your request";
  return response?.property_title || `${request?.property_type || "Property"} in ${location}`;
}

export async function getDashboardConversations(userId: string, accountType: AccountType): Promise<DashboardConversation[]> {
  const admin = createAdminClient();
  const participantColumn = accountType === "agent" ? "agent_user_id" : "home_seeker_user_id";

  const { data: conversationData } = await admin
    .from("conversations")
    .select(
      "conversation_id, request_id, home_seeker_user_id, agent_user_id, created_at, housing_requests(request_id, preferred_location, area, property_type, bedrooms, budget_min, budget_max, rent_duration, move_in_date, extra_notes, status), messages(message_id, conversation_id, sender_id, receiver_id, request_id, message, read_status, created_at)"
    )
    .eq(participantColumn, userId)
    .order("created_at", { ascending: false });

  const conversations = (conversationData ?? []) as unknown as RawConversation[];
  if (!conversations.length) return [];

  const seekerUserIds = unique(conversations.map((conversation) => conversation.home_seeker_user_id));
  const agentUserIds = unique(conversations.map((conversation) => conversation.agent_user_id));
  const requestIds = unique(conversations.map((conversation) => conversation.request_id));

  const [{ data: seekerData }, { data: agentData }] = await Promise.all([
    admin.from("home_seeker_profiles").select("home_seeker_id, user_id, full_name, phone").in("user_id", seekerUserIds),
    admin.from("agent_profiles").select("agent_id, user_id, full_name, agency_name, phone, whatsapp, profile_photo").in("user_id", agentUserIds)
  ]);

  const seekers = ((seekerData ?? []) as SeekerProfile[]).reduce((map, seeker) => map.set(seeker.user_id, seeker), new Map<string, SeekerProfile>());
  const agents = ((agentData ?? []) as AgentProfile[]).reduce((map, agent) => map.set(agent.user_id, agent), new Map<string, AgentProfile>());
  const agentIds = unique(Array.from(agents.values()).map((agent) => agent.agent_id));

  let responses: RequestResponse[] = [];
  if (requestIds.length && agentIds.length) {
    const { data: responseData } = await admin
      .from("request_responses")
      .select(
        "response_id, request_id, agent_id, message, property_title, property_location, property_price, property_images, inspection_available, status, created_at"
      )
      .in("request_id", requestIds)
      .in("agent_id", agentIds);
    responses = (responseData ?? []) as RequestResponse[];
  }

  return conversations.map((conversation) => {
    const agent = agents.get(conversation.agent_user_id);
    const seeker = seekers.get(conversation.home_seeker_user_id);
    const response = responses.find((item) => item.request_id === conversation.request_id && item.agent_id === agent?.agent_id);
    const request = conversation.housing_requests;
    const counterpartName =
      accountType === "agent"
        ? seeker?.full_name || "Home Seeker"
        : agent?.agency_name || agent?.full_name || "Agent";
    const counterpartPhone = accountType === "agent" ? seeker?.phone || null : agent?.phone || agent?.whatsapp || null;
    const propertyLocation = request?.area || request?.preferred_location || response?.property_location || "Location";

    return {
      conversation_id: conversation.conversation_id,
      request_id: conversation.request_id,
      home_seeker_user_id: conversation.home_seeker_user_id,
      agent_user_id: conversation.agent_user_id,
      counterpart_name: counterpartName,
      counterpart_phone: counterpartPhone,
      counterpart_role: accountType === "agent" ? "home_seeker" : "agent",
      property_title: fallbackTitle(request, response),
      property_location: propertyLocation,
      property_price: response?.property_price || "",
      property_images: response?.property_images || [],
      property_type: request?.property_type || "Property",
      bedrooms: request?.bedrooms || "Any",
      budget_min: Number(request?.budget_min || 0),
      budget_max: Number(request?.budget_max || 0),
      rent_duration: request?.rent_duration || "Yearly",
      move_in_date: request?.move_in_date || "",
      extra_notes: request?.extra_notes || null,
      request_status: request?.status || "pending",
      response_status: response?.status || null,
      initial_message: response?.message || null,
      created_at: conversation.created_at,
      messages: [...(conversation.messages ?? [])].sort(
        (first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime()
      )
    };
  });
}
