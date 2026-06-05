import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AgentDashboardPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const approved = agent?.kyc_status === "approved" && !agent?.suspended;
  const { data: responsesData } = await supabase
    .from("request_responses")
    .select("*, housing_requests(*)")
    .eq("agent_id", agent?.agent_id)
    .order("created_at", { ascending: false });
  const responses = responsesData ?? [];

  return (
    <DashboardShell
      kicker="Agent dashboard"
      nav={[
        ["Overview", "/dashboard/agent"],
        ["KYC Verification", "/dashboard/agent/kyc"],
        ["Available Requests", "/dashboard/agent/requests"],
        ["Accepted Requests", "/dashboard/agent#accepted"],
        ["Messages", "/dashboard/agent#messages"],
        ["Reviews", "/dashboard/agent#reviews"]
      ]}
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
          <span className="badge">{agent?.rating || "New"}</span>
          <h2>Rating</h2>
        </article>
      </div>

      <section className="panel">
        <h2>Profile summary</h2>
        <p>Operating locations: {agent?.operating_locations?.join(", ") || "Not set"}</p>
        <p>Specialties: {agent?.property_specialties?.join(", ") || "Not set"}</p>
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
    </DashboardShell>
  );
}
