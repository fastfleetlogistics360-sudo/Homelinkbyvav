import Link from "next/link";
import { AgentSubscriptionCard } from "@/components/agent-subscription-card";
import { DashboardShell } from "@/components/dashboard-shell";
import { TransactionHistory } from "@/components/transaction-history";
import { getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
import { createClient } from "@/lib/supabase/server";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";

export default async function AgentDashboardPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();

  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const approved = agent?.kyc_status === "approved" && !agent?.suspended;
  const plan = planForAgent(agent);
  const planBadge = getPlanBadge(agent?.agent_plan);
  const { data: responsesData } = await supabase
    .from("request_responses")
    .select("*, housing_requests(*)")
    .eq("agent_id", agent?.agent_id)
    .order("created_at", { ascending: false });
  const responses = responsesData ?? [];
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const payments = paymentsData ?? [];

  return (
    <DashboardShell
      kicker="Agent dashboard"
      nav={AGENT_DASHBOARD_NAV}
      title={agent?.agency_name || "Agent Dashboard"}
    >
      {!approved ? (
        <section className="panel">
          <span className={`badge ${agent?.kyc_status || "pending"}`}>{agent?.kyc_status || "pending"}</span>
          <h2>Complete approval before receiving requests.</h2>
          <p>Only approved and unsuspended agents can access live home seeker requests.</p>
          <Link className="button primary" href="/dashboard/agent/kyc">
            Complete KYC
          </Link>
        </section>
      ) : null}

      <div className="stats-grid">
        <article className="panel">
          <span className="badge approved">{approved ? "Approved" : "Locked"}</span>
          <h2>KYC status</h2>
        </article>
        <article className="panel">
          <span className="badge">{responses.length}</span>
          <h2>Accepted leads</h2>
        </article>
        <article className="panel">
          <span className={`badge plan-badge ${plan.id}`}>{planBadge || "Free Agent"}</span>
          <h2>Subscription</h2>
        </article>
      </div>

      <AgentSubscriptionCard agent={agent} />

      <section className="panel">
        <h2>Profile summary</h2>
        <p>Membership: {planBadge || "Free Agent"}</p>
        <p>Operating locations: {agent?.operating_locations?.join(", ") || "Not set"}</p>
        <p>Specialties: {agent?.property_specialties?.join(", ") || "Not set"}</p>
        <p>Rating: {agent?.rating || "New"}</p>
        <p>Completed matches: {agent?.total_completed_matches || 0}</p>
      </section>

      <section className="panel" id="accepted">
        <h2>Accepted Requests</h2>
        {responses.length ? (
          responses.map((response) => (
            <article className="card" key={response.response_id}>
              <span className={`badge ${response.status}`}>{response.status}</span>
              <h3>{response.property_title}</h3>
              <p>{response.message}</p>
              <p>
                Request: {response.housing_requests?.property_type} in {response.housing_requests?.area}
              </p>
            </article>
          ))
        ) : (
          <p>No accepted leads yet.</p>
        )}
      </section>

      <TransactionHistory payments={payments} />
    </DashboardShell>
  );
}
