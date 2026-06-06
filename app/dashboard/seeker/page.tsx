import Link from "next/link";
import { ArrowRight, BadgeCheck, Home, MessageCircle, Plus, ReceiptText, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { TransactionHistory } from "@/components/transaction-history";
import { markRequestFulfilledAction } from "@/lib/actions/requests";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
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
    .select("*, request_responses(*, agent_profiles(agency_name, phone, whatsapp, rating, agent_plan))")
    .eq("home_seeker_id", profile?.home_seeker_id)
    .order("created_at", { ascending: false });
  const requests = requestsData ?? [];
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const payments = paymentsData ?? [];
  const activeMatches = requests.filter((item) => item.status === "matched" || item.status === "accepted").length;
  const responseCount = requests.reduce((total, request) => total + (request.request_responses?.length || 0), 0);

  return (
    <DashboardShell
      kicker="Home seeker dashboard"
      nav={[
        ["Overview", "/dashboard/seeker"],
        ["Create Apartment Request", "/dashboard/seeker/requests/new"],
        ["Transaction History", "/dashboard/seeker#transactions"],
        ["Messages", "/dashboard/seeker#messages"],
        ["Profile Settings", "/dashboard/seeker#profile"]
      ]}
      title={`Welcome, ${profile?.full_name || "Home Seeker"}`}
    >
      <section className="dashboard-hero-card seeker-hero">
        <div>
          <p className="kicker">Your next home starts here</p>
          <h2>Track requests, compare agent responses, and move with confidence.</h2>
          <p>
            HomeLink keeps your apartment search organized from your first request to inspection day.
          </p>
          <div className="row-actions">
            <Link className="button primary" href="/dashboard/seeker/requests/new">
              <Plus size={18} />
              New request
            </Link>
            <Link className="button secondary" href="#transactions">
              <ReceiptText size={18} />
              View transactions
            </Link>
          </div>
        </div>
        <div className="dashboard-hero-orbit" aria-hidden="true">
          <span>
            <Home size={32} />
          </span>
        </div>
      </section>

      <div className="stats-grid dashboard-stat-grid">
        <article className="panel dashboard-stat-card">
          <span className="stat-icon">
            <Search size={20} />
          </span>
          <strong>{requests.length}</strong>
          <h2>Requests created</h2>
        </article>
        <article className="panel dashboard-stat-card">
          <span className="stat-icon matched">
            <BadgeCheck size={20} />
          </span>
          <strong>{activeMatches}</strong>
          <h2>Active matches</h2>
        </article>
        <article className="panel dashboard-stat-card">
          <span className="stat-icon">
            <MessageCircle size={20} />
          </span>
          <strong>{responseCount}</strong>
          <h2>Agent responses</h2>
        </article>
      </div>

      <section className="quick-action-grid" aria-label="Quick actions">
        <Link className="quick-action-card" href="/dashboard/seeker/requests/new">
          <span>
            <Plus size={20} />
          </span>
          <strong>Submit a new apartment request</strong>
          <em>Tell verified agents exactly what you need.</em>
          <ArrowRight size={18} />
        </Link>
        <a className="quick-action-card" href="#requests">
          <span>
            <Home size={20} />
          </span>
          <strong>Review request progress</strong>
          <em>See status, responses, and next actions.</em>
          <ArrowRight size={18} />
        </a>
        <a className="quick-action-card" href="#transactions">
          <span>
            <ReceiptText size={20} />
          </span>
          <strong>Check transaction history</strong>
          <em>Follow routing fees and payment statuses.</em>
          <ArrowRight size={18} />
        </a>
      </section>

      <section className="panel dashboard-section-panel" id="requests">
        <div className="response-title-row">
          <div>
            <p className="kicker">My Requests</p>
            <h2>Apartment search activity</h2>
          </div>
          <Link className="button secondary" href="/dashboard/seeker/requests/new">
            New request
          </Link>
        </div>
        {requests.length ? (
          <div className="request-card-stack">
            {requests.map((request) => (
              <article className="dashboard-request-card" key={request.request_id}>
                <div className="response-title-row">
                  <div>
                    <span className={`badge ${request.status}`}>{request.status}</span>
                    <h3>
                      {request.property_type} in {request.area || request.preferred_location}
                    </h3>
                  </div>
                  <strong>
                    ₦{request.budget_min?.toLocaleString()} - ₦{request.budget_max?.toLocaleString()}
                  </strong>
                </div>
                <div className="request-meta-grid">
                  <span>{request.rent_duration}</span>
                  <span>Move-in {request.move_in_date}</span>
                  <span>{request.bedrooms} bedroom preference</span>
                </div>
                {request.extra_notes ? <p>{request.extra_notes}</p> : null}
                <div className="agent-response-list">
                  <h4>Agent responses</h4>
                  {request.request_responses?.length ? (
                    [...request.request_responses]
                      .sort((a: any, b: any) => planForAgent(b.agent_profiles).rank - planForAgent(a.agent_profiles).rank)
                      .map((response: any) => {
                        const planBadge = getPlanBadge(response.agent_profiles?.agent_plan);
                        return (
                          <div className="response-mini-card" key={response.response_id}>
                            <div className="response-title-row">
                              <strong>{response.property_title}</strong>
                              <span className={`badge plan-badge ${planForAgent(response.agent_profiles).id}`}>
                                {planBadge || "Free Agent"}
                              </span>
                            </div>
                            <p>{response.message}</p>
                            <p>
                              {response.agent_profiles?.agency_name} | {response.property_price}
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
                        );
                      })
                  ) : (
                    <p>No agent responses yet.</p>
                  )}
                </div>
                {request.status !== "fulfilled" ? (
                  <form action={markRequestFulfilledAction}>
                    <input name="request_id" type="hidden" value={request.request_id} />
                    <button className="button secondary" type="submit">
                      Mark fulfilled
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No requests yet.</h3>
            <p>Create your first apartment request and let verified agents bring options to you.</p>
            <Link className="button primary" href="/dashboard/seeker/requests/new">
              Create request
            </Link>
          </div>
        )}
      </section>

      <TransactionHistory payments={payments} />
    </DashboardShell>
  );
}
