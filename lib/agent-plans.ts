import { AGENT_PLANS, type AgentPlanId } from "@/lib/constants";

type AgentLike = {
  agent_plan?: string | null;
  weekly_request_limit?: number | null;
  weekly_request_used?: number | null;
  last_reset_date?: string | null;
};

export function normalizeAgentPlan(plan?: string | null): AgentPlanId {
  if (plan === "premium" || plan === "platinum") return plan;
  return "free";
}

export function planForAgent(agent?: AgentLike | null) {
  return AGENT_PLANS[normalizeAgentPlan(agent?.agent_plan)];
}

export function getPlanBadge(plan?: string | null) {
  return AGENT_PLANS[normalizeAgentPlan(plan)].badge;
}

export function getWeeklyLimit(plan?: string | null) {
  return AGENT_PLANS[normalizeAgentPlan(plan)].weeklyLimit;
}

export function getRemainingQuota(agent?: AgentLike | null) {
  const plan = planForAgent(agent);
  if (plan.id === "platinum") return Infinity;
  const used = Number(agent?.weekly_request_used || 0);
  const limit = Number(agent?.weekly_request_limit || plan.weeklyLimit);
  return Math.max(limit - used, 0);
}

export function getQuotaLabel(agent?: AgentLike | null) {
  const plan = planForAgent(agent);
  if (plan.id === "platinum") return "Unlimited Access Enabled";
  const used = Number(agent?.weekly_request_used || 0);
  const limit = Number(agent?.weekly_request_limit || plan.weeklyLimit);
  return `${used} / ${limit}`;
}

export function getDaysUntilReset(lastResetDate?: string | null) {
  const reset = lastResetDate ? new Date(`${lastResetDate}T00:00:00`) : new Date();
  const weekStart = new Date(reset);
  weekStart.setDate(reset.getDate() - ((reset.getDay() + 6) % 7));
  const next = new Date(weekStart);
  next.setDate(weekStart.getDate() + 7);
  const diff = next.getTime() - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function sortAgentsByPlanRank<T extends { agent_plan?: string | null }>(agents: T[]) {
  return [...agents].sort((a, b) => planForAgent(b).rank - planForAgent(a).rank);
}
