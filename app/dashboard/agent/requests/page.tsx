import { AgentSubscriptionCard } from "@/components/agent-subscription-card";
import { AgentRequestsBoard } from "@/components/agent-requests-board";
import { DashboardShell } from "@/components/dashboard-shell";
import { getOpenMatchingRequestsForAgent, getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { isAgentKycApproved } from "@/lib/kyc";
import { createClient } from "@/lib/supabase/server";

export default async function AvailableRequestsPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const approved = isAgentKycApproved(agent);

  let requests = [];
  let requestsError = "";
  if (approved) {
    try {
      requests = await getOpenMatchingRequestsForAgent(agent);
    } catch (error) {
      requestsError = error instanceof Error ? error.message : "Unable to load matching requests.";
    }
  }

  return (
    <DashboardShell className="agent-requests-shell" kicker="Agent dashboard" nav={AGENT_DASHBOARD_NAV} title="Available Requests">
      <div className="agent-requests-page">
        {approved ? <AgentSubscriptionCard agent={agent} compact /> : null}

        {!approved ? (
          <section className="agent-requests-empty">
            <span className="badge pending">KYC required</span>
            <h2>Only approved agents can view live requests.</h2>
          </section>
        ) : requestsError ? (
          <section className="agent-requests-empty">
            <span className="badge rejected">Request sync issue</span>
            <h2>Unable to load matching requests.</h2>
            <p>{requestsError}</p>
          </section>
        ) : requests.length ? (
          <AgentRequestsBoard requests={requests} />
        ) : (
          <section className="agent-requests-empty">
            <h2>No matching requests yet.</h2>
            <p>New paid requests in your operating locations and specialties will appear here.</p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
