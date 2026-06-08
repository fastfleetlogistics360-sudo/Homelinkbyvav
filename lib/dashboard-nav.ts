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
  ["Overview", "/dashboard/seeker"],
  ["Create Apartment Request", "/dashboard/seeker/requests/new"],
  ["Refer & Earn", "/dashboard/referrals"],
  ["Transaction History", "/dashboard/seeker#transactions"],
  ["Messages", "/dashboard/seeker/messages"],
  ["Profile Settings", "/dashboard/seeker#profile"]
] satisfies Array<[string, string]>;
