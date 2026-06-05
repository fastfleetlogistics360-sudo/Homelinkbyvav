import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const user = await requireUser();
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase());
  if (!admins.includes(user.email?.toLowerCase() || "")) redirect("/");

  const supabase = createAdminClient();
  const [{ count: users }, { count: requests }, { count: agents }, { data: pendingAgentsData }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("housing_requests").select("*", { count: "exact", head: true }),
      supabase.from("agent_profiles").select("*", { count: "exact", head: true }),
      supabase.from("agent_profiles").select("*").eq("kyc_status", "pending")
    ]);

  return (
    <main className="dashboard">
      <p className="kicker">Admin ops</p>
      <h1>Platform moderation</h1>
      <div className="stats-grid">
        <article className="panel">
          <span className="badge">{users || 0}</span>
          <h2>Users</h2>
        </article>
        <article className="panel">
          <span className="badge">{agents || 0}</span>
          <h2>Agents</h2>
        </article>
        <article className="panel">
          <span className="badge">{requests || 0}</span>
          <h2>Requests</h2>
        </article>
      </div>
      <section className="panel">
        <h2>Pending KYC</h2>
        {(pendingAgentsData ?? []).map((agent) => (
          <article className="card" key={agent.agent_id}>
            <h3>{agent.agency_name}</h3>
            <p>{agent.full_name}</p>
            <p>Approve/reject from Supabase table editor or wire admin actions next.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
