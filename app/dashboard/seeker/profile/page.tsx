import { DashboardShell } from "@/components/dashboard-shell";
import { SeekerBottomNav } from "@/components/seeker-bottom-nav";
import { SeekerDashboardReferenceSections } from "@/components/seeker-dashboard-reference-sections";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function SeekerProfilePage() {
  const user = await requireAccountType("home_seeker");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("home_seeker_profiles")
    .select("home_seeker_id, full_name, phone, preferred_locations")
    .eq("user_id", user.id)
    .single();
  const { data: requestsData } = await supabase
    .from("housing_requests")
    .select("*, request_responses(response_id)")
    .eq("home_seeker_id", profile?.home_seeker_id)
    .order("created_at", { ascending: false });
  const requests = requestsData ?? [];
  const responseCount = requests.reduce((total, request) => total + (request.request_responses?.length || 0), 0);
  const { count: savedCount } = await supabase
    .from("saved_properties")
    .select("*", { count: "exact", head: true })
    .eq("home_seeker_id", profile?.home_seeker_id || "");

  return (
    <DashboardShell className="agent-compact-shell seeker-compact-shell seeker-mobile-compact" kicker="Home seeker dashboard" nav={SEEKER_DASHBOARD_NAV} title="Profile">
      <div className="seeker-shell-page">
        <SeekerDashboardReferenceSections
          email={user.email || "No email attached"}
          fullName={profile?.full_name || "Home Seeker"}
          payments={[]}
          phone={profile?.phone}
          preferredLocations={profile?.preferred_locations ?? []}
          requests={requests}
          responseCount={responseCount}
          savedCount={savedCount || 0}
          sections={["profile"]}
        />
      </div>
      <SeekerBottomNav active="profile" />
    </DashboardShell>
  );
}
