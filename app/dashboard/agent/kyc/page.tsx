import { AgentKycForm } from "@/components/agent-kyc-form";
import { DashboardShell } from "@/components/dashboard-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Clock3, FilePenLine, Headphones, LayoutDashboard } from "lucide-react";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
import { getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { isAgentKycApproved } from "@/lib/kyc";
import { createClient } from "@/lib/supabase/server";

export default async function AgentKycPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; submitted?: string }>;
}) {
  const params = await searchParams;
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const plan = planForAgent(agent);
  const planBadge = getPlanBadge(agent?.agent_plan);

  if (params?.submitted === "1" && isAgentKycApproved(agent)) {
    redirect("/dashboard/agent");
  }

  if (params?.submitted === "1") {
    return (
      <DashboardShell kicker="Agent dashboard" nav={AGENT_DASHBOARD_NAV} title="KYC Submitted">
        <section className="kyc-submitted">
          <div className="kyc-success-illustration" aria-hidden="true">
            <span className="kyc-clock">
              <Clock3 size={22} />
            </span>
            <ShieldSuccess />
            <span className="kyc-check">
              <Check size={26} />
            </span>
          </div>
          <span className="kyc-status-badge">Pending Verification</span>
          <h1>KYC Submitted Successfully</h1>
          <p>Your KYC details have been submitted successfully.</p>
          <p>Our team will review your information and verify your account.</p>
          <p>You will receive a notification once approval is complete.</p>

          <article className="kyc-status-card">
            <div>
              <span>Verification Status:</span>
              <strong>Pending Review</strong>
            </div>
            <div>
              <span>Expected Review Time:</span>
              <strong>24-72 Hours</strong>
            </div>
          </article>

          <div className="kyc-action-list">
            <Link href="/dashboard/agent">
              <LayoutDashboard size={22} />
              Browse Dashboard
            </Link>
            <Link href="/dashboard/agent/kyc">
              <FilePenLine size={22} />
              Update KYC Information
            </Link>
            <Link href="/#contact">
              <Headphones size={22} />
              Contact Support
            </Link>
          </div>

          <Link className="button navy full" href="/dashboard/agent">
            Go To Dashboard
          </Link>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      kicker="Agent dashboard"
      nav={AGENT_DASHBOARD_NAV}
      title="KYC Verification"
    >
      <section className="panel">
        <div className="response-title-row">
          <span className={`badge ${agent?.kyc_status || "pending"}`}>{agent?.kyc_status || "pending"}</span>
          <span className={`badge plan-badge ${plan.id}`}>{planBadge || "Free Agent"}</span>
        </div>
        <h2>Complete agent verification</h2>
        <p>Upload clear documents and choose only the locations and property types you actively serve.</p>
      </section>
      <AgentKycForm agent={agent} error={params?.error} />
    </DashboardShell>
  );
}

function ShieldSuccess() {
  return (
    <svg className="kyc-shield-art" fill="none" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
      <circle cx="110" cy="110" r="102" fill="#FFF5DE" />
      <path d="M110 35L169 58V102C169 142 144 175 110 188C76 175 51 142 51 102V58L110 35Z" fill="#061632" />
      <path d="M84 110L103 129L140 88" stroke="#D28A0D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="14" />
    </svg>
  );
}
