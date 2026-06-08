import { ReferralsPageClient } from "@/components/referrals-page-client";
import { ensureProfile, requireUser } from "@/lib/auth";
import { AGENT_DASHBOARD_NAV, SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { getReferralOverview } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/server";

export default async function ReferralsPage({
  searchParams
}: {
  searchParams?: Promise<{ withdrawal_error?: string; withdrawal?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const profile = await ensureProfile(user);
  const supabase = await createClient();
  const [{ data: notificationsData }, overview] = await Promise.all([
    supabase
      .from("notifications")
      .select("notification_id, type, message, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    getReferralOverview(user.id)
  ]);

  return (
    <ReferralsPageClient
      accountType={profile.account_type}
      nav={profile.account_type === "agent" ? AGENT_DASHBOARD_NAV : SEEKER_DASHBOARD_NAV}
      notifications={notificationsData ?? []}
      overview={overview}
      profileName={profile.full_name || "HomeLink User"}
      withdrawalError={params?.withdrawal_error}
      withdrawalSuccess={params?.withdrawal === "requested" ? "requested" : undefined}
    />
  );
}
