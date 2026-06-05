import Link from "next/link";
import { AgentSubscriptionCard } from "@/components/agent-subscription-card";
import { DashboardShell } from "@/components/dashboard-shell";
import { getPlanBadge, planForAgent } from "@/lib/agent-plans";
import { getRefreshedAgentProfile } from "@/lib/agents";
import { AGENT_PLANS, type AgentPlanId } from "@/lib/constants";
import { AGENT_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SubscriptionPageProps = {
  searchParams?: Promise<{
    quota?: string;
    payment?: string;
  }>;
};

const comparisonRows = [
  ["Weekly acceptances", "10", "50", "Unlimited"],
  ["In-app notifications", "Included", "Included", "Included"],
  ["Email alerts", "Not included", "Included", "Included"],
  ["SMS architecture", "Not included", "Not included", "Placeholder ready"],
  ["Search ranking", "Standard", "Boosted", "Priority"],
  ["Agent badge", "Free Agent", "Premium Agent", "Platinum Agent"],
  ["Analytics", "Basic", "Advanced", "Advanced"],
  ["Support", "Standard", "Standard", "Dedicated section"]
];

export default async function AgentSubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const params = await searchParams;
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const agent = await getRefreshedAgentProfile(supabase, user.id);
  const currentPlan = planForAgent(agent);

  return (
    <DashboardShell kicker="Agent dashboard" nav={AGENT_DASHBOARD_NAV} title="Subscription">
      {params?.quota === "exhausted" ? (
        <section className="panel upgrade-modal" role="status">
          <span className="badge pending">Quota exhausted</span>
          <h2>You have used all available apartment request acceptances for your current plan.</h2>
          <p>Upgrade now to continue receiving leads.</p>
          <div className="row-actions">
            <Link className="button primary" href="/api/paystack/initialize?plan=premium">
              Upgrade to Premium
            </Link>
            <Link className="button navy" href="/api/paystack/initialize?plan=platinum">
              Go Platinum
            </Link>
          </div>
        </section>
      ) : null}

      {params?.payment === "verified" ? (
        <section className="panel success-panel">
          <span className="badge approved">Payment verified</span>
          <h2>Your subscription has been updated.</h2>
          <p>Your weekly quota and plan benefits are now active on your agent account.</p>
        </section>
      ) : null}

      {params?.payment === "failed" ? (
        <section className="panel upgrade-modal">
          <span className="badge rejected">Payment not completed</span>
          <h2>Your subscription payment was not completed.</h2>
          <p>You can try again whenever you are ready.</p>
        </section>
      ) : null}

      <AgentSubscriptionCard agent={agent} />

      <section className="panel">
        <div className="section-title-row">
          <div>
            <p className="kicker">Agent Membership Plans</p>
            <h2>Choose how fast you want to grow your leads.</h2>
          </div>
        </div>
        <div className="pricing-grid">
          {(Object.keys(AGENT_PLANS) as AgentPlanId[]).map((planId) => {
            const plan = AGENT_PLANS[planId];
            const isCurrent = currentPlan.id === plan.id;
            const planBadge = getPlanBadge(plan.id);
            return (
              <article className={`pricing-card ${plan.id}`} key={plan.id}>
                {plan.highlight ? <span className="promo-tag">{plan.highlight}</span> : null}
                <span className={`badge plan-badge ${plan.id}`}>{planBadge || "Free Agent"}</span>
                <h3>{plan.name}</h3>
                <p className="price">
                  ₦{plan.price.toLocaleString()}
                  <span>/{plan.interval}</span>
                </p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.restrictions.length ? (
                  <p className="restriction-copy">{plan.restrictions.join(" • ")}</p>
                ) : null}
                {plan.id === "free" ? (
                  <Link className="button secondary full" href="/dashboard/agent">
                    {isCurrent ? "Current Plan" : "Start Free"}
                  </Link>
                ) : (
                  <Link className={`button ${plan.id === "platinum" ? "navy" : "primary"} full`} href={`/api/paystack/initialize?plan=${plan.id}`}>
                    {isCurrent ? "Renew Plan" : plan.id === "premium" ? "Upgrade to Premium" : "Go Platinum"}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <p className="kicker">Feature comparison</p>
        <h2>Plan benefits at a glance.</h2>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Premium</th>
                <th>Platinum</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, free, premium, platinum]) => (
                <tr key={feature}>
                  <td>{feature}</td>
                  <td>{free}</td>
                  <td>{premium}</td>
                  <td>{platinum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
