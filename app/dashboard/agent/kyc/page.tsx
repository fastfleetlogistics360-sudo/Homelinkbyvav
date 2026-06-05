import { AgentKycForm } from "@/components/agent-kyc-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
import { getRefreshedAgentProfile } from "@/lib/agents";
import { requireAccountType } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AgentKycPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const plan = planForAgent(agent);
  const planBadge = getPlanBadge(agent?.agent_plan);

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
