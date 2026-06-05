export type AccountType = "home_seeker" | "agent";
export type KycStatus = "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "matched" | "accepted" | "fulfilled" | "cancelled";
export type ResponseStatus = "pending" | "accepted" | "rejected";

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
  rating: number;
  total_completed_matches: number;
  suspended: boolean;
};
