export const AGENT_DASHBOARD_NAV = [
  ["Overview", "/dashboard/agent"],
  ["KYC Verification", "/dashboard/agent/kyc"],
  ["Available Requests", "/dashboard/agent/requests"],
  ["Accepted Requests", "/dashboard/agent#accepted"],
  ["Subscription", "/dashboard/agent/subscription"],
  ["Transaction History", "/dashboard/agent#transactions"],
  ["Messages", "/dashboard/agent#messages"],
  ["Reviews", "/dashboard/agent#reviews"]
] satisfies Array<[string, string]>;
