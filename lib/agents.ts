import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getRefreshedAgentProfile(supabase: SupabaseServerClient, userId: string) {
  const { data: agent } = await supabase.from("agent_profiles").select("*").eq("user_id", userId).single();

  if (!agent?.agent_id) return agent;

  await supabase.rpc("reset_agent_weekly_quota", { target_agent_id: agent.agent_id });
  const { data: refreshedAgent } = await supabase.from("agent_profiles").select("*").eq("user_id", userId).single();
  return refreshedAgent ?? agent;
}
