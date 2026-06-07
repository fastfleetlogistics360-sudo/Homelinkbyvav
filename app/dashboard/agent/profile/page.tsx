import Image from "next/image";
import Link from "next/link";
import { Building2, CheckCircle2, IdCard, MapPin, Phone, Star } from "lucide-react";
import { AgentProfileActions } from "@/components/agent-profile-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
import { getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { isAgentKycApproved, normalizeKycStatus } from "@/lib/kyc";
import { createClient } from "@/lib/supabase/server";

function displayList(values?: string[] | null) {
  return values?.length ? values.join(", ") : "Not set";
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export default async function AgentProfilePage({
  searchParams
}: {
  searchParams?: Promise<{ password?: string; password_error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const approved = isAgentKycApproved(agent);
  const kycStatus = normalizeKycStatus(agent?.kyc_status);
  const plan = planForAgent(agent);
  const planBadge = getPlanBadge(agent?.agent_plan) || "Free Agent";
  const agencyName = agent?.agency_name || agent?.full_name || "Agent Profile";
  const photo = agent?.profile_photo || "/images/homelink-logo.png";
  const activityItems = [
    `KYC status: ${approved ? "Verified" : kycStatus}`,
    `Current plan: ${planBadge}`,
    `Weekly requests used: ${agent?.weekly_request_used ?? 0} / ${agent?.weekly_request_limit ?? 0}`,
    `Last quota reset: ${formatDate(agent?.last_reset_date)}`
  ];

  return (
    <DashboardShell kicker="Agent dashboard" nav={AGENT_DASHBOARD_NAV} title="Profile">
      <section className="agent-profile-page">
        <header className="agent-profile-heading">
          <p>Agent Dashboard</p>
          <h1>Profile</h1>
          <span>Manage your agency profile and preferences.</span>
        </header>

        <article className="agent-profile-hero-card">
          <div className="agent-profile-photo">
            <Image alt={agencyName} height={150} src={photo} width={150} />
          </div>
          <div className="agent-profile-identity">
            <h2>{agencyName}</h2>
            <span className={approved ? "verified" : "pending"}>
              <CheckCircle2 size={22} />
              {approved ? "Verified" : kycStatus}
            </span>
          </div>
          <Link className="agent-profile-kyc-button" href="/dashboard/agent/kyc">
            <IdCard size={26} />
            Update KYC
          </Link>
        </article>

        <article className="agent-profile-info-card">
          <div>
            <span>
              <Building2 size={28} />
            </span>
            <strong>Agency</strong>
            <p>{agencyName}</p>
          </div>
          <div>
            <span>
              <Phone size={28} />
            </span>
            <strong>Phone</strong>
            <p>{agent?.phone || "Not set"}</p>
          </div>
          <div>
            <span>
              <MapPin size={28} />
            </span>
            <strong>Locations</strong>
            <p>{displayList(agent?.operating_locations)}</p>
          </div>
          <div>
            <span>
              <Star size={28} />
            </span>
            <strong>Specialties</strong>
            <p>{displayList(agent?.property_specialties)}</p>
          </div>
        </article>

        <AgentProfileActions
          activityItems={activityItems}
          passwordError={params?.password_error}
          passwordSent={params?.password === "sent"}
        />
      </section>
    </DashboardShell>
  );
}
