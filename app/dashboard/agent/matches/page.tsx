import { AgentMatchesBoard, type AgentMatchConversation, type AgentMatchResponse } from "@/components/agent-matches-board";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAccountType } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AgentMatchesPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();

  const { data: responsesData } = await supabase
    .from("request_responses")
    .select("*, housing_requests(*)")
    .order("created_at", { ascending: false });
  const responses = (responsesData ?? []) as AgentMatchResponse[];
  const requestIds = Array.from(new Set(responses.map((response) => response.request_id).filter(Boolean)));
  let conversationsData: AgentMatchConversation[] = [];

  if (requestIds.length) {
    const { data } = await supabase
      .from("conversations")
      .select(
        "conversation_id, request_id, home_seeker_user_id, agent_user_id, created_at, messages(message_id, sender_id, receiver_id, request_id, message, read_status, created_at)"
      )
      .in("request_id", requestIds)
      .eq("agent_user_id", user.id);
    conversationsData = (data ?? []) as AgentMatchConversation[];
  }

  const conversationsByRequestId = new Map(conversationsData.map((conversation) => [conversation.request_id, conversation]));
  const matchResponses = responses.map((response) => ({
    ...response,
    conversation: conversationsByRequestId.get(response.request_id) ?? null
  }));

  return (
    <DashboardShell kicker="Agent dashboard" nav={AGENT_DASHBOARD_NAV} title="Matches">
      <div className="agent-matches-page">
        <div className="agent-matches-heading">
          <p>Agent Dashboard</p>
          <h2>Matches</h2>
          <span>Requests you have responded to and matched.</span>
        </div>
        <AgentMatchesBoard agentUserId={user.id} responses={matchResponses} />
      </div>
    </DashboardShell>
  );
}
