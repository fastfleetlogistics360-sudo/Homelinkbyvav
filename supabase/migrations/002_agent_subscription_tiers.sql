-- Agent subscription tiers for HomeLink by V-A.V
-- Safe additive migration. Does not remove or rename existing tables/columns.

do $$ begin
  create type public.agent_plan as enum ('free', 'premium', 'platinum');
exception when duplicate_object then null; end $$;

alter table public.agent_profiles
  add column if not exists agent_plan public.agent_plan not null default 'free',
  add column if not exists agent_plan_expiry timestamptz,
  add column if not exists weekly_request_limit integer not null default 10,
  add column if not exists weekly_request_used integer not null default 0,
  add column if not exists last_reset_date date not null default current_date;

update public.agent_profiles
set
  weekly_request_limit = case
    when agent_plan = 'premium' then 50
    when agent_plan = 'platinum' then -1
    else 10
  end,
  weekly_request_used = coalesce(weekly_request_used, 0),
  last_reset_date = coalesce(last_reset_date, current_date);

create or replace function public.agent_week_start(input_date date default current_date)
returns date
language sql
immutable
as $$
  select (date_trunc('week', input_date::timestamp))::date;
$$;

alter table public.agent_profiles
  alter column last_reset_date set default public.agent_week_start(current_date);

update public.agent_profiles
set last_reset_date = public.agent_week_start(coalesce(last_reset_date, current_date));

create or replace function public.refresh_agent_subscription(target_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.agent_profiles
  set
    agent_plan = 'free',
    agent_plan_expiry = null,
    weekly_request_limit = 10,
    weekly_request_used = 0,
    last_reset_date = public.agent_week_start(current_date)
  where agent_id = target_agent_id
    and agent_plan in ('premium', 'platinum')
    and agent_plan_expiry is not null
    and agent_plan_expiry < now();
end;
$$;

create or replace function public.reset_agent_weekly_quota(target_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_week date := public.agent_week_start(current_date);
begin
  perform public.refresh_agent_subscription(target_agent_id);

  update public.agent_profiles
  set
    weekly_request_used = 0,
    last_reset_date = current_week,
    weekly_request_limit = case
      when agent_plan = 'premium' then 50
      when agent_plan = 'platinum' then -1
      else 10
    end
  where agent_id = target_agent_id
    and public.agent_week_start(last_reset_date) < current_week;
end;
$$;

create or replace function public.agent_can_accept_request(target_agent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_agent public.agent_profiles;
begin
  perform public.reset_agent_weekly_quota(target_agent_id);

  select * into target_agent
  from public.agent_profiles
  where agent_id = target_agent_id;

  if not found then
    return false;
  end if;

  if target_agent.agent_plan = 'platinum' then
    return true;
  end if;

  return target_agent.weekly_request_used < target_agent.weekly_request_limit;
end;
$$;

create or replace function public.increment_agent_weekly_usage(target_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.reset_agent_weekly_quota(target_agent_id);

  update public.agent_profiles
  set weekly_request_used = weekly_request_used + 1
  where agent_id = target_agent_id
    and agent_plan <> 'platinum';
end;
$$;

create or replace function public.apply_agent_subscription(
  target_agent_id uuid,
  target_plan public.agent_plan,
  target_expiry timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.agent_profiles
  set
    agent_plan = target_plan,
    agent_plan_expiry = target_expiry,
    weekly_request_limit = case
      when target_plan = 'premium' then 50
      when target_plan = 'platinum' then -1
      else 10
    end,
    weekly_request_used = 0,
    last_reset_date = public.agent_week_start(current_date)
  where agent_id = target_agent_id;
end;
$$;

create or replace function public.match_agents_for_request(target_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_request public.housing_requests;
begin
  select * into target_request from public.housing_requests where request_id = target_request_id;
  if not found then return; end if;

  insert into public.request_matches (request_id, agent_id, notified_at)
  select target_request.request_id, agent.agent_id, now()
  from public.agent_profiles agent
  where agent.kyc_status = 'approved'
    and agent.suspended = false
    and target_request.preferred_location = any(agent.operating_locations)
    and target_request.property_type = any(agent.property_specialties)
  order by case
    when agent.agent_plan = 'platinum' then 3
    when agent.agent_plan = 'premium' then 2
    else 1
  end desc, agent.rating desc, agent.total_completed_matches desc
  on conflict (request_id, agent_id) do nothing;

  if exists (select 1 from public.request_matches where request_id = target_request.request_id) then
    update public.housing_requests set status = 'matched' where request_id = target_request.request_id;
  end if;
end;
$$;

create or replace function public.notify_matched_agents(target_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.match_agents_for_request(target_request_id);

  insert into public.notifications (user_id, type, message)
  select
    agent.user_id,
    case
      when agent.agent_plan = 'platinum' then 'new_housing_request_priority_sms_placeholder'
      when agent.agent_plan = 'premium' then 'new_housing_request_email'
      else 'new_housing_request'
    end,
    case
      when agent.agent_plan = 'platinum' then 'Priority request available. SMS placeholder queued for future provider.'
      when agent.agent_plan = 'premium' then 'New matching housing request is available. Email alert enabled.'
      else 'New matching housing request is available.'
    end
  from public.request_matches match
  join public.agent_profiles agent on agent.agent_id = match.agent_id
  where match.request_id = target_request_id;
end;
$$;
