import { DashboardMessagesBoard } from "@/components/dashboard-messages-board";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { getDashboardConversations } from "@/lib/messages";

export default async function SeekerMessagesPage() {
  const user = await requireAccountType("home_seeker");
  const conversations = await getDashboardConversations(user.id, "home_seeker");

  return (
    <DashboardShell kicker="Home seeker dashboard" nav={SEEKER_DASHBOARD_NAV} title="Messages">
      <DashboardMessagesBoard accountType="home_seeker" conversations={conversations} currentUserId={user.id} returnTo="/dashboard/seeker/messages" />
    </DashboardShell>
  );
}
