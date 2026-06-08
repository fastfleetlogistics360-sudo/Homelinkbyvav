export type AccountType = "home_seeker" | "agent";
export type KycStatus = "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "matched" | "accepted" | "fulfilled" | "cancelled";
export type ResponseStatus = "pending" | "accepted" | "rejected";
export type AgentPlan = "free" | "premium" | "platinum";
export type ReferralStatus = "pending" | "qualified" | "paid" | "cancelled";
export type WithdrawalStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  account_type: AccountType;
  full_name: string;
  email: string;
};

export type HousingRequest = {
  request_id: string;
  home_seeker_id: string;
  preferred_location: string;
  area: string | null;
  property_type: string;
  bedrooms: string;
  budget_min: number;
  budget_max: number;
  rent_duration: string;
  move_in_date: string;
  extra_notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

export type AgentProfile = {
  agent_id: string;
  user_id: string;
  full_name: string;
  agency_name: string;
  phone: string | null;
  whatsapp: string | null;
  profile_photo: string | null;
  operating_locations: string[];
  property_specialties: string[];
  kyc_status: KycStatus;
  verification_documents: string[];
  terms_accepted_at: string | null;
  agent_plan: AgentPlan;
  agent_plan_expiry: string | null;
  weekly_request_limit: number;
  weekly_request_used: number;
  last_reset_date: string;
  rating: number;
  total_completed_matches: number;
  suspended: boolean;
};

export type ReferralCode = {
  id: string;
  user_id: string;
  referral_code: string;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referred_user_type: AccountType;
  reward_amount: number;
  status: ReferralStatus;
  qualification_reason: string | null;
  created_at: string;
  qualified_at: string | null;
};

export type ReferralWallet = {
  id: string;
  user_id: string;
  available_balance: number;
  total_earned: number;
  total_paid: number;
  qualified_referrals: number;
  agent_referrals: number;
  seeker_referrals: number;
  created_at: string;
  updated_at: string;
};

export type CreditReward = {
  id: string;
  user_id: string;
  credits: number;
  source: string;
  source_referral_id: string | null;
  created_at: string;
};

export type WithdrawalRequest = {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  amount: number;
  status: WithdrawalStatus;
  created_at: string;
  approved_at: string | null;
};
