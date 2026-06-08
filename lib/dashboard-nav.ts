export const AGENT_DASHBOARD_NAV = [
  ["Overview", "/dashboard/agent"],
  ["KYC Verification", "/dashboard/agent/kyc"],
  ["Available Requests", "/dashboard/agent/requests"],
  ["Matches", "/dashboard/agent/matches"],
  ["Subscription", "/dashboard/agent/subscription"],
  ["Refer & Earn", "/dashboard/referrals"],
  ["Transaction History", "/dashboard/agent#transactions"],
  ["Messages", "/dashboard/agent/messages"],
  ["Profile", "/dashboard/agent/profile"],
  ["Reviews", "/dashboard/agent#reviews"]
] satisfies Array<[string, string]>;

export const SEEKER_DASHBOARD_NAV = [
  ["Dashboard", "/dashboard/seeker"],
  ["Requests", "/dashboard/seeker/requests"],
  ["Messages", "/dashboard/seeker/messages"],
  ["Refer & Earn", "/dashboard/referrals"],
  ["Transaction History", "/dashboard/seeker/transactions"],
  ["Profile", "/dashboard/seeker/profile"]
] satisfies Array<[string, string]>;
