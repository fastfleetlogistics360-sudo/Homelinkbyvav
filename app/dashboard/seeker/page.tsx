import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { markRequestFulfilledAction } from "@/lib/actions/requests";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SeekerDashboardPage() {
  const user = await requireAccountType("home_seeker");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("home_seeker_profiles")
    .select("home_seeker_id, full_name")
    .eq("user_id", user.id)
    .single();

  const { data: requestsData } = await supabase
    .from("housing_requests")
    .select("*, request_responses(*, agent_profiles(agency_name, phone, whatsapp, rating))")
    .eq("home_seeker_id", profile?.home_seeker_id)
    .order("created_at", { ascending: false });
  const requests = requestsData ?? [];

  return (
    <DashboardShell
      kicker="Home seeker dashboard"
      nav={[
        ["Overview", "/dashboard/seeker"],
        ["Create Apartment Request", "/dashboard/seeker/requests/new"],
        ["Messages", "/dashboard/seeker#messages"],
        ["Profile Settings", "/dashboard/seeker#profile"]
      ]}
      title={`Welcome, ${profile?.full_name || "Home Seeker"}`}
    >
      <div className="stats-grid">
        <article className="panel">
          <span className="badge">{requests.length}</span>
          <h2>My requests</h2>
        </article>
        <article className="panel">
          <span className="badge matched">
            {requests.filter((item) => item.status === "matched" || item.status === "accepted").length}
          </span>
          <h2>Active matches</h2>
        </article>
        <article className="panel">
          <Link className="button primary" href="/dashboard/seeker/requests/new">
            New request
          </Link>
        </article>
      </div>

      <section className="panel">
        <h2>My Requests</h2>
        {requests.length ? (
          requests.map((request) => (
            <article className="card" key={request.request_id}>
              <span className={`badge ${request.status}`}>{request.status}</span>
              <h3>
                {request.property_type} in {request.area || request.preferred_location}
              </h3>
              <p>
                Budget: ₦{request.budget_min?.toLocaleString()} - ₦
                {request.budget_max?.toLocaleString()} • Move-in {request.move_in_date}
              </p>
              <p>{request.extra_notes}</p>
              <h4>Agent responses</h4>
              {request.request_responses?.length ? (
                request.request_responses.map((response: any) => (
                  <div className="card" key={response.response_id}>
                    <strong>{response.property_title}</strong>
                    <p>{response.message}</p>
                    <p>
                      {response.agent_profiles?.agency_name} • {response.property_price}
                    </p>
                    <div className="row-actions">
                      {response.agent_profiles?.phone ? (
                        <a className="button secondary" href={`tel:${response.agent_profiles.phone}`}>
                          Call
                        </a>
                      ) : null}
                      {response.agent_profiles?.whatsapp ? (
                        <a className="button secondary" href={`https://wa.me/${response.agent_profiles.whatsapp}`}>
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p>No agent responses yet.</p>
              )}
              {request.status !== "fulfilled" ? (
                <form action={markRequestFulfilledAction}>
                  <input name="request_id" type="hidden" value={request.request_id} />
                  <button className="button secondary" type="submit">
                    Mark fulfilled
                  </button>
                </form>
              ) : null}
            </article>
          ))
        ) : (
          <p>No requests yet. Create your first apartment request.</p>
        )}
      </section>
    </DashboardShell>
  );
}
