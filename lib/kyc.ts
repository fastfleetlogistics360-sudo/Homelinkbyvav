import type { AgentProfile } from "@/lib/types";

export function normalizeKycStatus(status?: string | null) {
  if (status === "approved" || status === "verified") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

export function isAgentKycApproved(agent?: Partial<AgentProfile> | null) {
  return normalizeKycStatus(agent?.kyc_status) === "approved" && !agent?.suspended;
}

export function getAgentKycProgress(agent?: Partial<AgentProfile> | null) {
  if (isAgentKycApproved(agent)) {
    return { percent: 100, steps: 5 };
  }

  const completedSteps = [
    Boolean(agent?.user_id || agent?.agent_id),
    Boolean(agent?.full_name && agent?.phone),
    Boolean(agent?.agency_name),
    Boolean(agent?.operating_locations?.length && agent?.property_specialties?.length),
    Boolean(agent?.verification_documents?.length || agent?.profile_photo)
  ].filter(Boolean).length;

  return {
    percent: Math.min(100, completedSteps * 20),
    steps: completedSteps
  };
}
