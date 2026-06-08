import Link from "next/link";
import { ClipboardList, Copy, RotateCcw } from "lucide-react";
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
  const actionLabel = plan.id === "free" ? "Upgrade Plan" : "Manage Plan";

  return (
    <section className={`panel subscription-card ${compact ? "compact" : ""}`}>
      <div className="subscription-card-head">
        <div>
          <p className="kicker">Agent subscription</p>
          <h2>Current Plan: {plan.name.replace(" Agent", "").toUpperCase()}</h2>
          {plan.badge ? <span className={`badge plan-badge ${plan.id}`}>{plan.badge}</span> : <span className="badge">Free Agent</span>}
        </div>
        <Link className="button primary subscription-card-action" href="/dashboard/agent/subscription">
          {actionLabel}
        </Link>
      </div>

      {plan.id === "platinum" ? (
        <div className="quota-unlimited">
          <strong>Unlimited Access Enabled</strong>
          <span>{used} accepted this week. Priority ranking, early request access, and dedicated support are active.</span>
        </div>
      ) : (
        <>
          <div className="quota-row">
            <article>
              <span className="quota-icon purple">
                <ClipboardList size={22} />
              </span>
              <div>
                <span>Used</span>
                <strong>{getQuotaLabel(agent)}</strong>
              </div>
            </article>
            <article>
              <span className="quota-icon blue">
                <Copy size={22} />
              </span>
              <div>
                <span>Remaining</span>
                <strong>{remaining}</strong>
              </div>
            </article>
            <article>
              <span className="quota-icon green">
                <RotateCcw size={22} />
              </span>
              <div>
                <span>Resets</span>
                <strong>{resetDays === 1 ? "1 day" : `${resetDays} days`}</strong>
              </div>
            </article>
          </div>
          <div className="quota-meter" aria-label={`${usagePercent}% of weekly request acceptances used`}>
            <span style={{ width: `${usagePercent}%` }} />
          </div>
        </>
      )}
    </section>
  );
}
