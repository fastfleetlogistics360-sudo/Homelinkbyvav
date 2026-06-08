import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Gift,
  Handshake,
  Home,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  UserRound
} from "lucide-react";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";
import { ReferralDashboardCard } from "@/components/referral-dashboard-card";
import { getOpenMatchingRequestsForAgent, getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { getAgentKycProgress, isAgentKycApproved, normalizeKycStatus } from "@/lib/kyc";
import { getReferralOverview } from "@/lib/referrals";

export default async function AgentDashboardPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();

  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const approved = isAgentKycApproved(agent);
  const { data: responsesData } = await supabase
    .from("request_responses")
    .select("*, housing_requests(*)")
    .eq("agent_id", agent?.agent_id)
    .order("created_at", { ascending: false });
  const responses = responsesData ?? [];
  const canCountRequests =
    approved && Boolean(agent?.operating_locations?.length) && Boolean(agent?.property_specialties?.length);
  const openRequests = canCountRequests ? await getOpenMatchingRequestsForAgent(agent).catch(() => []) : [];
  const newRequestCount = openRequests.length;
  const activeMatches = responses.filter((response) => response.status === "pending" || response.status === "accepted").length;
  const acceptedResponses = responses.filter((response) => response.status === "accepted");
  const kycStatus = normalizeKycStatus(agent?.kyc_status);
  const kycProgress = getAgentKycProgress(agent);
  const { percent: kycPercent, steps: kycSteps } = kycProgress;
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("notification_id, type, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);
  const notifications = notificationsData ?? [];
  const referralOverview = await getReferralOverview(user.id);
  const kycCard =
    kycStatus === "approved"
      ? {
          badge: "Verified",
          title: "Agent verification complete",
          text: "Your agent account is verified. You can now receive and respond to home seeker requests.",
          button: "View requests",
          href: "/dashboard/agent/requests",
          className: "approved"
        }
      : kycStatus === "rejected"
        ? {
            badge: "Action Required",
            title: "KYC needs attention",
            text: "Please update your submitted information and resubmit for review.",
            button: "Update KYC",
            href: "/dashboard/agent/kyc",
            className: "rejected"
          }
        : {
            badge: "Pending Verification",
            title: "Complete agent verification",
            text: "Upload clear documents and choose only the locations and property types you actively serve.",
            button: "Continue",
            href: "/dashboard/agent/kyc",
            className: "pending"
          };
  const agentStats = [
    { label: "New Requests", value: newRequestCount, Icon: ClipboardList, tone: "blue", href: "/dashboard/agent/requests" },
    { label: "Agent Responses", value: responses.length, Icon: MessageSquare, tone: "green", href: "/dashboard/agent/matches" },
    { label: "Active Matches", value: activeMatches, Icon: Handshake, tone: "gold", href: "/dashboard/agent/matches" },
    { label: "Total Responses", value: responses.length, Icon: LayoutDashboard, tone: "purple", href: "/dashboard/agent/matches" }
  ];

  return (
    <main className="agent-dashboard-ui">
      <header className="mobile-dashboard-header">
        <Link className="mobile-dashboard-brand" href="/">
          <Image alt="HomeLink by V-A.V" height={86} src="/images/homelink-logo.png" width={86} />
          <span>
            Home<span>Link</span>
            <small>by V-A.V</small>
          </span>
        </Link>
        <DashboardNotifications notifications={notifications} returnTo="/dashboard/agent" />
        <MobileDrawerMenu items={AGENT_DASHBOARD_NAV} showLogout subtitle="Agent dashboard" title={agent?.agency_name || "Agent Dashboard"} variant="dashboard" />
      </header>

      <section className="agent-hero-reference">
        <div>
          <p>Agent Dashboard</p>
          <h1>Welcome back, {agent?.agency_name || agent?.full_name || "Agent"}</h1>
          <span>
            {approved
              ? "Your verification is complete. You can now receive home seeker requests."
              : "Complete your verification to start receiving home seeker requests."}
          </span>
          <div className="agent-progress-lockup">
            <div className="agent-progress-ring" style={{ "--progress": `${kycPercent}%` } as CSSProperties}>
              <strong>{kycPercent}%</strong>
            </div>
            <div>
              <strong>KYC Verification Progress</strong>
              <small>{kycSteps} of 5 steps completed</small>
            </div>
          </div>
        </div>
        <div className="agent-shield-art" aria-hidden="true">
          <Image alt="" fill priority sizes="(max-width: 640px) 48vw, 320px" src="/images/agent-hero-shield.png" />
        </div>
      </section>

      <section className="agent-stat-grid">
        {agentStats.map(({ label, value, Icon, tone, href }) => (
          <article key={label} className="agent-stat-card">
            <span className={tone}>
              <Icon size={30} />
            </span>
            <strong>{value}</strong>
            <p>{label}</p>
            <Link href={href}>
              View all
              <ChevronRight size={18} />
            </Link>
          </article>
        ))}
      </section>

      <ReferralDashboardCard overview={referralOverview} />

      <section className={`agent-kyc-status-card ${kycCard.className}`}>
        <span className="agent-kyc-icon">{approved ? <Check size={34} /> : <FileText size={34} />}</span>
        <div className="agent-kyc-copy">
          <em>{kycCard.badge}</em>
          <h2>{kycCard.title}</h2>
          <p>{kycCard.text}</p>
          <div className="agent-kyc-progress">
            <span style={{ width: `${kycPercent}%` }} />
          </div>
          <strong>{kycSteps} of 5 steps completed</strong>
        </div>
        <Link href={kycCard.href}>
          {kycCard.button}
          <ChevronRight size={22} />
        </Link>
      </section>

      <section className="agent-quick-actions">
        <h2>Quick Actions</h2>
        <div>
          <Link href="/dashboard/agent/requests">
            <span className="blue">
              <Plus size={30} />
            </span>
            <strong>Add Property</strong>
            <small>List a new property</small>
            <ChevronRight size={26} />
          </Link>
          <Link href="/dashboard/agent/requests">
            <span className="green">
              <Search size={30} />
            </span>
            <strong>Find Home Seekers</strong>
            <small>Browse home seekers</small>
            <ChevronRight size={26} />
          </Link>
          <Link href="/dashboard/agent/kyc">
            <span className="purple">
              <FileText size={30} />
            </span>
            <strong>KYC Documents</strong>
            <small>Manage your documents</small>
            <ChevronRight size={26} />
          </Link>
          <Link href="/dashboard/agent/profile">
            <span className="gold">
              <Settings size={30} />
            </span>
            <strong>Account Settings</strong>
            <small>Manage your account</small>
            <ChevronRight size={26} />
          </Link>
        </div>
      </section>

      <section className="agent-dashboard-section" id="properties">
        <div className="mobile-section-row">
          <h2>Properties</h2>
          <Link href="/dashboard/agent/requests">Add property</Link>
        </div>
        <p className="dashboard-muted-copy">
          Add property options by responding to matching home seeker requests. Approved agents can submit property title,
          location, price, images, and inspection availability from Available Requests.
        </p>
        <div className="agent-mini-list">
          {acceptedResponses.length ? (
            acceptedResponses.slice(0, 3).map((response) => (
              <article key={response.response_id}>
                <span className="badge approved">Listed</span>
                <strong>{response.property_title}</strong>
                <small>
                  {response.property_location} | {response.property_price}
                </small>
              </article>
            ))
          ) : (
            <article>
              <span className="badge pending">No listings</span>
              <strong>No property options submitted yet.</strong>
              <small>Open Available Requests to add your first property response.</small>
            </article>
          )}
        </div>
      </section>

      <section className="agent-dashboard-section" id="transactions">
        <div className="mobile-section-row">
          <h2>Transactions</h2>
          <Link href="/dashboard/agent/subscription">Upgrade plan</Link>
        </div>
        <p className="dashboard-muted-copy">Subscription and response activity will appear here.</p>
      </section>

      <section className="agent-dashboard-section" id="reviews">
        <h2>Reviews</h2>
        <p className="dashboard-muted-copy">Client reviews will appear here after completed matches.</p>
      </section>

      <nav className="mobile-bottom-nav agent" aria-label="Agent navigation">
        <Link className="active" href="/dashboard/agent">
          <Home size={28} />
          Dashboard
        </Link>
        <Link href="/dashboard/agent/requests">
          <FileText size={28} />
          Requests
        </Link>
        <Link href="/dashboard/agent/matches">
          <Handshake size={28} />
          Matches
        </Link>
        <Link href="/dashboard/referrals">
          <Gift size={28} />
          Refer
        </Link>
        <Link href="/dashboard/agent/messages">
          <MessageSquare size={28} />
          Messages
        </Link>
        <Link href="/dashboard/agent/profile">
          <UserRound size={28} />
          Profile
        </Link>
      </nav>
    </main>
  );
}
