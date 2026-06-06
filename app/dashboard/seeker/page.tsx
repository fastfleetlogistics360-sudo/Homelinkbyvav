import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  FileText,
  Grid2X2,
  Home,
  House,
  MessageCircle,
  Plus,
  ReceiptText,
  UserRound
} from "lucide-react";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";
import { markRequestFulfilledAction } from "@/lib/actions/requests";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const seekerNav = [
  ["Overview", "/dashboard/seeker"],
  ["Create Apartment Request", "/dashboard/seeker/requests/new"],
  ["Transaction History", "/dashboard/seeker#transactions"],
  ["Messages", "/dashboard/seeker#messages"],
  ["Profile Settings", "/dashboard/seeker#profile"]
] satisfies Array<[string, string]>;

function formatNaira(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(value || 0));
}

function paymentLabel(payment: any) {
  if (payment.reference?.startsWith("HL-SUB")) return "Agent subscription";
  if (payment.request_id) return "Agent connection fee";
  return "HomeLink payment";
}

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
  const firstName = (profile?.full_name || "Home Seeker").split(" ")[0] || "Home Seeker";

  return (
    <main className="seeker-dashboard-ui">
      <header className="mobile-dashboard-header">
        <Link className="mobile-dashboard-brand" href="/">
          <Image alt="HomeLink by V-A.V" height={86} src="/images/homelink-logo.png" width={86} />
          <span>
            Home<span>Link</span>
            <small>by V-A.V</small>
            <em>Request a Home. Get Matched Fast.</em>
          </span>
        </Link>
        <button className="dashboard-bell" aria-label="Notifications" type="button">
          <Bell size={28} />
          <span />
        </button>
        <MobileDrawerMenu items={seekerNav} showLogout subtitle="Home seeker dashboard" title={profile?.full_name || "Home Seeker"} variant="dashboard" />
      </header>

      <section className="seeker-hero-reference">
        <div>
          <p>Home Seeker Dashboard</p>
          <h1>Welcome, {profile?.full_name || firstName}</h1>
          <span>Let&apos;s help you find the perfect home.</span>
        </div>
        <div className="seeker-house-art" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="reference-section">
        <h2>Overview</h2>
        <div className="seeker-overview-grid">
          <article>
            <span className="gold">
              <ClipboardList size={30} />
            </span>
            <strong>{requests.length}</strong>
            <h3>Requests created</h3>
            <p>Total requests you&apos;ve made</p>
          </article>
          <article>
            <span className="green">
              <House size={30} />
            </span>
            <strong>{activeMatches}</strong>
            <h3>Active matches</h3>
            <p>Agents actively responding</p>
          </article>
          <article>
            <span className="blue">
              <MessageCircle size={30} />
            </span>
            <strong>{responseCount}</strong>
            <h3>Agent responses</h3>
            <p>Responses from agents</p>
          </article>
        </div>
      </section>

      <section className="seeker-action-list" aria-label="Quick actions">
        <Link href="/dashboard/seeker/requests/new">
          <span className="navy">
            <Plus size={34} />
          </span>
          <strong>Submit a new apartment request</strong>
          <em>Tell verified agents exactly what you need.</em>
          <ChevronRight size={30} />
        </Link>
        <a href="#requests">
          <span className="gold">
            <Home size={32} />
          </span>
          <strong>Review request progress</strong>
          <em>See status, responses, and next actions.</em>
          <ChevronRight size={30} />
        </a>
        <a href="#transactions">
          <span className="green">
            <ReceiptText size={32} />
          </span>
          <strong>Check transaction history</strong>
          <em>Follow routing fees and payment statuses.</em>
          <ChevronRight size={30} />
        </a>
      </section>

      <section className="reference-section seeker-requests-section" id="requests">
        <div className="mobile-section-row">
          <h2>My Requests</h2>
          <Link href="/dashboard/seeker/requests/new">
            <Plus size={22} />
            New request
          </Link>
        </div>
        <h3>Apartment search activity</h3>
        {requests.length ? (
          <div className="seeker-request-stack">
            {requests.map((request) => (
              <article className="seeker-request-card" key={request.request_id}>
                <Link aria-label="Open request" href="/dashboard/seeker#requests">
                  <ChevronRight size={30} />
                </Link>
                <span className={`badge ${request.status}`}>{request.status}</span>
                <h4>
                  {request.property_type} in {request.area || request.preferred_location}
                </h4>
                <strong>
                  {formatNaira(request.budget_min)} - {formatNaira(request.budget_max)}
                </strong>
                <div>
                  <span>{request.rent_duration}</span>
                  <span>Move-in {request.move_in_date}</span>
                  <span>{request.bedrooms} bedroom preference</span>
                </div>
                <p>That&apos;s all</p>
                <div className="seeker-response-area">
                  <h5>Agent responses</h5>
                  {request.request_responses?.length ? (
                    [...request.request_responses]
                      .sort((a: any, b: any) => planForAgent(b.agent_profiles).rank - planForAgent(a.agent_profiles).rank)
                      .map((response: any) => {
                        const planBadge = getPlanBadge(response.agent_profiles?.agent_plan);
                        return (
                          <div className="seeker-response-card" key={response.response_id}>
                            <div>
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
                  <form className="seeker-fulfill-form" action={markRequestFulfilledAction}>
                    <input name="request_id" type="hidden" value={request.request_id} />
                    <button type="submit">
                      Mark fulfilled
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="seeker-empty-state">
            <h3>No requests yet.</h3>
            <p>Create your first apartment request and let verified agents bring options to you.</p>
            <Link href="/dashboard/seeker/requests/new">
              Create request
            </Link>
          </div>
        )}
      </section>

      <section className="reference-section seeker-transaction-section" id="transactions">
        <div className="mobile-section-row">
          <div>
            <h2>Transaction History</h2>
            <h3>Payments and receipts</h3>
          </div>
          <a href="#transactions">
            <FileText size={20} />
            View all
          </a>
        </div>
        {payments.length ? (
          <div className="seeker-transaction-list">
            {payments.map((payment) => (
              <article key={payment.payment_id}>
                <span>{payments.length}</span>
                <div>
                  <strong>{paymentLabel(payment)}</strong>
                  <small>{payment.reference}</small>
                </div>
                <div>
                  <strong>{formatNaira(payment.amount)}</strong>
                  <small>{new Date(payment.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</small>
                </div>
                <em className={`badge ${payment.status === "paid" ? "approved" : "pending"}`}>{payment.status}</em>
              </article>
            ))}
          </div>
        ) : (
          <p className="seeker-muted-line">No transactions yet.</p>
        )}
      </section>

      <nav className="mobile-bottom-nav" aria-label="Home seeker navigation">
        <Link className="active" href="/dashboard/seeker">
          <Home size={28} />
          Home
        </Link>
        <Link href="/dashboard/seeker/requests/new">
          <Grid2X2 size={28} />
          Requests
        </Link>
        <a href="#messages">
          <MessageCircle size={28} />
          Messages
        </a>
        <a href="#transactions">
          <ReceiptText size={28} />
          Transactions
        </a>
        <a href="#profile">
          <UserRound size={28} />
          Profile
        </a>
      </nav>
    </main>
  );
}
