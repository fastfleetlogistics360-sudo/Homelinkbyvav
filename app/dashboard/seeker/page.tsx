import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ClipboardList,
  Home,
  House,
  MessageCircle,
  Plus,
  ReceiptText
} from "lucide-react";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";
import { ReferralDashboardCard } from "@/components/referral-dashboard-card";
import { SeekerBottomNav } from "@/components/seeker-bottom-nav";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { getReferralOverview } from "@/lib/referrals";
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
    .select("request_id, status, request_responses(response_id)")
    .eq("home_seeker_id", profile?.home_seeker_id)
    .order("created_at", { ascending: false });
  const requests = requestsData ?? [];
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
    <main className="agent-dashboard-ui seeker-dashboard-ui">
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

      <section className="agent-hero-reference seeker-hero-reference">
        <div>
          <p>Home Seeker Dashboard</p>
          <h1>Welcome, {profile?.full_name || firstName}</h1>
          <span>Let&apos;s help you find the perfect home.</span>
        </div>
        <div className="seeker-house-art" aria-hidden="true">
          <Image alt="" fill priority sizes="(max-width: 640px) 58vw, 48vw" src="/images/seeker-hero-house.png" />
        </div>
      </section>

      <section className="agent-stat-grid seeker-overview-grid" aria-label="Overview">
        <article className="agent-stat-card">
          <span className="gold">
            <ClipboardList size={30} />
          </span>
          <strong>{requests.length}</strong>
          <p>Requests created</p>
          <Link href="/dashboard/seeker/requests">
            View all
            <ChevronRight size={18} />
          </Link>
        </article>
        <article className="agent-stat-card">
          <span className="green">
            <House size={30} />
          </span>
          <strong>{activeMatches}</strong>
          <p>Active matches</p>
          <Link href="/dashboard/seeker/requests">
            View all
            <ChevronRight size={18} />
          </Link>
        </article>
        <article className="agent-stat-card">
          <span className="blue">
            <MessageCircle size={30} />
          </span>
          <strong>{responseCount}</strong>
          <p>Agent responses</p>
          <Link href="/dashboard/seeker/messages">
            View all
            <ChevronRight size={18} />
          </Link>
        </article>
      </section>

      <ReferralDashboardCard overview={referralOverview} />

      <section className="agent-quick-actions" aria-label="Quick actions">
        <h2>Quick Actions</h2>
        <div>
          <Link href="/dashboard/seeker/requests/new">
            <span className="blue">
              <Plus size={34} />
            </span>
            <strong>Submit a new apartment request</strong>
            <small>Tell verified agents exactly what you need.</small>
            <ChevronRight size={30} />
          </Link>
          <Link href="/dashboard/seeker/requests">
            <span className="gold">
              <Home size={32} />
            </span>
            <strong>Review request progress</strong>
            <small>See status, responses, and next actions.</small>
            <ChevronRight size={30} />
          </Link>
          <Link href="/dashboard/seeker/transactions">
            <span className="green">
              <ReceiptText size={32} />
            </span>
            <strong>Check transaction history</strong>
            <small>Follow routing fees and payment statuses.</small>
            <ChevronRight size={30} />
          </Link>
        </div>
      </section>

      <SeekerBottomNav active="dashboard" />
    </main>
  );
}
