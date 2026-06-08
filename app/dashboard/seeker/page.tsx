import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ClipboardList,
  Gift,
  Grid2X2,
  Home,
  House,
  MessageCircle,
  Plus,
  ReceiptText,
  UserRound
} from "lucide-react";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";
import { ReferralDashboardCard } from "@/components/referral-dashboard-card";
import { SeekerDashboardReferenceSections } from "@/components/seeker-dashboard-reference-sections";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { getReferralOverview } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/server";

export default async function SeekerDashboardPage() {
  const user = await requireAccountType("home_seeker");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("home_seeker_profiles")
    .select("home_seeker_id, full_name, phone, preferred_locations")
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
  const { count: savedCount } = await supabase
    .from("saved_properties")
    .select("*", { count: "exact", head: true })
    .eq("home_seeker_id", profile?.home_seeker_id || "");
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("notification_id, type, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);
  const notifications = notificationsData ?? [];
  const referralOverview = await getReferralOverview(user.id);
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
        <DashboardNotifications notifications={notifications} returnTo="/dashboard/seeker" />
        <MobileDrawerMenu items={SEEKER_DASHBOARD_NAV} showLogout subtitle="Home seeker dashboard" title={profile?.full_name || "Home Seeker"} variant="dashboard" />
      </header>

      <section className="seeker-hero-reference">
        <div>
          <p>Home Seeker Dashboard</p>
          <h1>Welcome, {profile?.full_name || firstName}</h1>
          <span>Let&apos;s help you find the perfect home.</span>
        </div>
        <div className="seeker-house-art" aria-hidden="true">
          <Image alt="" fill priority sizes="(max-width: 640px) 58vw, 48vw" src="/images/seeker-hero-house.png" />
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

      <ReferralDashboardCard overview={referralOverview} />

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

      <SeekerDashboardReferenceSections
        email={user.email || "No email attached"}
        fullName={profile?.full_name || "Home Seeker"}
        payments={payments}
        phone={profile?.phone}
        preferredLocations={profile?.preferred_locations ?? []}
        requests={requests}
        responseCount={responseCount}
        savedCount={savedCount || 0}
      />

      <section className="reference-section seeker-messages-section" id="messages">
        <div className="mobile-section-row">
          <h2>Messages</h2>
          <Link href="#requests">View responses</Link>
        </div>
        <p className="seeker-muted-line">Messages will appear after an agent responds to your request.</p>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Home seeker navigation">
        <Link className="active" href="/dashboard/seeker">
          <Home size={28} />
          Home
        </Link>
        <Link href="#requests">
          <Grid2X2 size={28} />
          Requests
        </Link>
        <Link href="/dashboard/seeker/messages">
          <MessageCircle size={28} />
          Messages
        </Link>
        <Link href="/dashboard/referrals">
          <Gift size={28} />
          Refer
        </Link>
        <Link href="#transactions">
          <ReceiptText size={28} />
          Transactions
        </Link>
        <Link href="#profile">
          <UserRound size={28} />
          Profile
        </Link>
      </nav>
    </main>
  );
}
