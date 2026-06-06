import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Handshake,
  Home,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";
import { getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";

export default async function AgentDashboardPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();

  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const approved = agent?.kyc_status === "approved" && !agent?.suspended;
  const { data: responsesData } = await supabase
    .from("request_responses")
    .select("*, housing_requests(*)")
    .eq("agent_id", agent?.agent_id)
    .order("created_at", { ascending: false });
  const responses = responsesData ?? [];
  const canCountRequests =
    approved && Boolean(agent?.operating_locations?.length) && Boolean(agent?.property_specialties?.length);
  const requestsQuery = canCountRequests
    ? await supabase
        .from("housing_requests")
        .select("request_id", { count: "exact", head: true })
        .in("preferred_location", agent?.operating_locations)
        .in("property_type", agent?.property_specialties)
        .in("status", ["pending", "matched"])
    : { count: 0 };
  const newRequestCount = requestsQuery.count || 0;
  const activeMatches = responses.filter((response) => response.status === "pending" || response.status === "accepted").length;
  const kycStatus = agent?.kyc_status || "pending";
  const kycSteps = approved ? 5 : 2;
  const kycPercent = approved ? 100 : 40;
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
    { label: "New Requests", value: newRequestCount, Icon: ClipboardList, tone: "blue" },
    { label: "Agent Responses", value: responses.length, Icon: MessageSquare, tone: "green" },
    { label: "Active Matches", value: activeMatches, Icon: Handshake, tone: "gold" },
    { label: "Total Responses", value: responses.length, Icon: LayoutDashboard, tone: "purple" }
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
        <button className="dashboard-bell" aria-label="Notifications" type="button">
          <Bell size={28} />
          <span />
        </button>
        <MobileDrawerMenu items={AGENT_DASHBOARD_NAV} showLogout subtitle="Agent dashboard" title={agent?.agency_name || "Agent Dashboard"} variant="dashboard" />
      </header>

      {!approved ? (
        <section className="agent-pending-banner">
          <strong>KYC Verification Pending</strong>
          <span>Complete verification approval to start receiving apartment requests.</span>
        </section>
      ) : null}

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
          <ShieldCheck size={150} />
          <span />
        </div>
      </section>

      <section className="agent-stat-grid">
        {agentStats.map(({ label, value, Icon, tone }) => (
          <article key={label} className="agent-stat-card">
            <span className={tone}>
              <Icon size={30} />
            </span>
            <strong>{value}</strong>
            <p>{label}</p>
            <Link href="/dashboard/agent/requests">
              View all
              <ChevronRight size={18} />
            </Link>
          </article>
        ))}
      </section>

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
          <a href="#properties">
            <span className="blue">
              <Plus size={30} />
            </span>
            <strong>Add Property</strong>
            <small>List a new property</small>
            <ChevronRight size={26} />
          </a>
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
          <a href="#profile">
            <span className="gold">
              <Settings size={30} />
            </span>
            <strong>Account Settings</strong>
            <small>Manage your account</small>
            <ChevronRight size={26} />
          </a>
        </div>
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
        <a href="#accepted">
          <Handshake size={28} />
          Matches
        </a>
        <a href="#properties">
          <Building2 size={28} />
          Properties
        </a>
        <a href="#profile">
          <UserRound size={28} />
          Profile
        </a>
      </nav>
    </main>
  );
}
