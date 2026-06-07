import { DashboardMessagesBoard } from "@/components/dashboard-messages-board";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAccountType } from "@/lib/auth";
import { getDashboardConversations } from "@/lib/messages";

const seekerNav = [
  ["Overview", "/dashboard/seeker"],
  ["Create Apartment Request", "/dashboard/seeker/requests/new"],
  ["Transaction History", "/dashboard/seeker#transactions"],
  ["Messages", "/dashboard/seeker/messages"],
  ["Profile Settings", "/dashboard/seeker#profile"]
] satisfies Array<[string, string]>;

export default async function SeekerMessagesPage() {
  const user = await requireAccountType("home_seeker");
  const conversations = await getDashboardConversations(user.id, "home_seeker");

  return (
    <DashboardShell kicker="Home seeker dashboard" nav={seekerNav} title="Messages">
      <DashboardMessagesBoard accountType="home_seeker" conversations={conversations} currentUserId={user.id} returnTo="/dashboard/seeker/messages" />
    </DashboardShell>
  );
}
