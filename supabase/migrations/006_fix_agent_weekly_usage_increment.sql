-- Keep agent weekly acceptance usage updating for older rows with null plans.

create or replace function public.increment_agent_weekly_usage(target_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.reset_agent_weekly_quota(target_agent_id);

  update public.agent_profiles
  set weekly_request_used = coalesce(weekly_request_used, 0) + 1
  where agent_id = target_agent_id
    and coalesce(agent_plan, 'free') <> 'platinum';
end;
$$;
