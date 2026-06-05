import { DashboardShell } from "@/components/dashboard-shell";
import { createRequestResponseAction } from "@/lib/actions/agent";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AvailableRequestsPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const { data: agent } = await supabase.from("agent_profiles").select("*").eq("user_id", user.id).single();
  const approved = agent?.kyc_status === "approved" && !agent?.suspended;

  const requestsQuery = approved
    ? await supabase
        .from("housing_requests")
        .select("*")
        .in("preferred_location", agent.operating_locations)
        .in("property_type", agent.property_specialties)
        .in("status", ["pending", "matched"])
        .order("created_at", { ascending: false })
    : { data: [] };
  const requests = requestsQuery.data ?? [];

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
      title="Available Requests"
    >
      {!approved ? (
        <section className="panel">
          <span className="badge pending">KYC required</span>
          <h2>Only approved agents can view live requests.</h2>
        </section>
      ) : requests.length ? (
        requests.map((request) => (
          <article className="panel" key={request.request_id}>
            <span className={`badge ${request.status}`}>{request.status}</span>
            <h2>
              {request.property_type} in {request.area || request.preferred_location}
            </h2>
            <p>
              ₦{request.budget_min?.toLocaleString()} - ₦{request.budget_max?.toLocaleString()} •{" "}
              {request.rent_duration}
            </p>
            <p>{request.extra_notes}</p>
            <form action={createRequestResponseAction}>
              <input name="request_id" type="hidden" value={request.request_id} />
              <label>
                Message
                <textarea name="message" required rows={3} />
              </label>
              <div className="form-grid">
                <label>
                  Property title
                  <input name="property_title" required />
                </label>
                <label>
                  Property location
                  <input name="property_location" required />
                </label>
                <label>
                  Property price
                  <input name="property_price" required />
                </label>
                <label>
                  Image URLs, comma separated
                  <input name="property_images" />
                </label>
              </div>
              <label>
                <input name="inspection_available" type="checkbox" /> Inspection available
              </label>
              <button className="button primary" type="submit">
                Accept / Respond
              </button>
            </form>
          </article>
        ))
      ) : (
        <section className="panel">
          <h2>No matching requests yet.</h2>
          <p>New paid requests in your operating locations and specialties will appear here.</p>
        </section>
      )}
    </DashboardShell>
  );
}
