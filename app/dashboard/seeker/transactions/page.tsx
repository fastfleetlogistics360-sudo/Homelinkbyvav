import { DashboardShell } from "@/components/dashboard-shell";
import { SeekerBottomNav } from "@/components/seeker-bottom-nav";
import { SeekerDashboardReferenceSections } from "@/components/seeker-dashboard-reference-sections";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function SeekerTransactionsPage() {
  const user = await requireAccountType("home_seeker");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("home_seeker_profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single();
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell className="agent-compact-shell seeker-compact-shell" kicker="Home seeker dashboard" nav={SEEKER_DASHBOARD_NAV} title="Transactions">
      <div className="seeker-shell-page">
        <SeekerDashboardReferenceSections
          email={user.email || "No email attached"}
          fullName={profile?.full_name || "Home Seeker"}
          payments={paymentsData ?? []}
          preferredLocations={[]}
          requests={[]}
          responseCount={0}
          savedCount={0}
          sections={["transactions"]}
        />
      </div>
      <SeekerBottomNav active="transactions" />
    </DashboardShell>
  );
}
