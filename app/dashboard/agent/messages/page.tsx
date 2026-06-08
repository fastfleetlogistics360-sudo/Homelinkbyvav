import { DashboardMessagesBoard } from "@/components/dashboard-messages-board";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAccountType } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { getDashboardConversations } from "@/lib/messages";

export default async function AgentMessagesPage() {
  const user = await requireAccountType("agent");
  const conversations = await getDashboardConversations(user.id, "agent");

  return (
    <DashboardShell className="agent-compact-shell" kicker="Agent dashboard" nav={AGENT_DASHBOARD_NAV} title="Messages">
      <DashboardMessagesBoard accountType="agent" conversations={conversations} currentUserId={user.id} returnTo="/dashboard/agent/messages" />
    </DashboardShell>
  );
}
