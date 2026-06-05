import { DashboardShell } from "@/components/dashboard-shell";
import { saveAgentKycAction } from "@/lib/actions/agent";
import { requireAccountType } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AgentKycPage() {
  const user = await requireAccountType("agent");
  const supabase = await createClient();
  const { data: agent } = await supabase.from("agent_profiles").select("*").eq("user_id", user.id).single();

  return (
    <DashboardShell
      kicker="Agent dashboard"
      nav={[
        ["Overview", "/dashboard/agent"],
        ["KYC Verification", "/dashboard/agent/kyc"],
        ["Available Requests", "/dashboard/agent/requests"],
        ["Accepted Requests", "/dashboard/agent#accepted"],
        ["Messages", "/dashboard/agent#messages"],
        ["Reviews", "/dashboard/agent#reviews"]
      ]}
      title="KYC Verification"
    >
      <form className="panel" action={saveAgentKycAction}>
        <span className={`badge ${agent?.kyc_status || "pending"}`}>{agent?.kyc_status || "pending"}</span>
        <div className="form-grid">
          <label>
            Agency name
            <input name="agency_name" defaultValue={agent?.agency_name || ""} required />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={agent?.phone || ""} required />
          </label>
          <label>
            WhatsApp
            <input name="whatsapp" defaultValue={agent?.whatsapp || ""} required />
          </label>
          <label>
            Profile photo URL
            <input name="profile_photo" defaultValue={agent?.profile_photo || ""} />
          </label>
        </div>
        <label>
          Operating locations, comma separated
          <input name="operating_locations" defaultValue={agent?.operating_locations?.join(", ") || ""} required />
        </label>
        <label>
          Property specialties, comma separated
          <input name="property_specialties" defaultValue={agent?.property_specialties?.join(", ") || ""} required />
        </label>
        <label>
          Verification documents, comma separated
          <textarea name="verification_documents" defaultValue={agent?.verification_documents?.join(", ") || ""} rows={4} />
        </label>
        <button className="button primary" type="submit">
          Submit KYC details
        </button>
      </form>
    </DashboardShell>
  );
}
