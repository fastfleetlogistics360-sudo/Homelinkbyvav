import Link from "next/link";
import { getDaysUntilReset, getRemainingQuota, getQuotaLabel, planForAgent } from "@/lib/agent-plans";
import { type AgentProfile } from "@/lib/types";

type SubscriptionCardProps = {
  agent?: Partial<AgentProfile> | null;
  compact?: boolean;
};

export function AgentSubscriptionCard({ agent, compact = false }: SubscriptionCardProps) {
  const plan = planForAgent(agent);
  const used = Number(agent?.weekly_request_used || 0);
  const limit = Number(agent?.weekly_request_limit || plan.weeklyLimit);
  const remaining = getRemainingQuota(agent);
  const resetDays = getDaysUntilReset(agent?.last_reset_date);
  const usagePercent = plan.id === "platinum" ? 100 : Math.min(Math.round((used / Math.max(limit, 1)) * 100), 100);

  return (
    <section className={`panel subscription-card ${compact ? "compact" : ""}`}>
      <div className="subscription-card-head">
        <div>
          <p className="kicker">Agent subscription</p>
          <h2>Current Plan: {plan.name.replace(" Agent", "").toUpperCase()}</h2>
        </div>
        {plan.badge ? <span className={`badge plan-badge ${plan.id}`}>{plan.badge}</span> : <span className="badge">Free Agent</span>}
      </div>

      {plan.id === "platinum" ? (
        <div className="quota-unlimited">
          <strong>Unlimited Access Enabled</strong>
          <span>Priority ranking, early request access, and dedicated support are active.</span>
        </div>
      ) : (
        <>
          <div className="quota-row">
            <div>
              <span>Used</span>
              <strong>{getQuotaLabel(agent)}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{remaining}</strong>
            </div>
            <div>
              <span>Resets</span>
              <strong>{resetDays === 1 ? "1 day" : `${resetDays} days`}</strong>
            </div>
          </div>
          <div className="quota-meter" aria-label={`${usagePercent}% of weekly request acceptances used`}>
            <span style={{ width: `${usagePercent}%` }} />
          </div>
        </>
      )}

      <div className="row-actions">
        <Link className="button primary" href="/dashboard/agent/subscription">
          {plan.id === "free" ? "Upgrade Plan" : "Manage Plan"}
        </Link>
      </div>
    </section>
  );
}
