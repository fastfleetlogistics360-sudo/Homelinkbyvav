import { DashboardShell } from "@/components/dashboard-shell";
import { SeekerBottomNav } from "@/components/seeker-bottom-nav";
import { SeekerDashboardReferenceSections } from "@/components/seeker-dashboard-reference-sections";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function SeekerRequestsPage() {
  const user = await requireAccountType("home_seeker");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("home_seeker_profiles")
    .select("home_seeker_id, full_name, phone, preferred_locations")
    .eq("user_id", user.id)
    .single();
  const { data: requestsData } = await supabase
    .from("housing_requests")
    .select("*, request_responses(*, agent_profiles(agency_name, phone, whatsapp, rating, agent_plan))")
    .eq("home_seeker_id", profile?.home_seeker_id)
    .order("created_at", { ascending: false });
  const requests = requestsData ?? [];
  const responseCount = requests.reduce((total, request) => total + (request.request_responses?.length || 0), 0);

  return (
    <DashboardShell className="agent-compact-shell seeker-compact-shell" kicker="Home seeker dashboard" nav={SEEKER_DASHBOARD_NAV} title="Requests">
      <div className="seeker-shell-page">
        <SeekerDashboardReferenceSections
          email={user.email || "No email attached"}
          fullName={profile?.full_name || "Home Seeker"}
          payments={[]}
          phone={profile?.phone}
          preferredLocations={profile?.preferred_locations ?? []}
          requests={requests}
          responseCount={responseCount}
          savedCount={0}
          sections={["requests"]}
        />
      </div>
      <SeekerBottomNav active="requests" />
    </DashboardShell>
  );
}
