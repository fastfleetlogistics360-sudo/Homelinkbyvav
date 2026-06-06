-- ============================================================================
-- Source: supabase/migrations/001_homelink_schema.sql
-- ============================================================================
-- HomeLink by V-A.V app-ready Supabase schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.account_type as enum ('home_seeker', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kyc_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'matched', 'accepted', 'fulfilled', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.response_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type public.account_type not null,
  full_name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_seeker_profiles (
  home_seeker_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  preferred_locations text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_profiles (
  agent_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  agency_name text not null,
  phone text,
  whatsapp text,
  profile_photo text,
  operating_locations text[] not null default '{}',
  property_specialties text[] not null default '{}',
  kyc_status public.kyc_status not null default 'pending',
  verification_documents text[] not null default '{}',
  rating numeric(3,2) not null default 0,
  total_completed_matches integer not null default 0,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housing_requests (
  request_id uuid primary key default gen_random_uuid(),
  home_seeker_id uuid not null references public.home_seeker_profiles(home_seeker_id) on delete cascade,
  preferred_location text not null,
  area text,
  property_type text not null,
  bedrooms text not null,
  budget_min numeric not null check (budget_min >= 0),
  budget_max numeric not null check (budget_max >= budget_min),
  rent_duration text not null,
  move_in_date date not null,
  extra_notes text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_matches (
  match_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.housing_requests(request_id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(agent_id) on delete cascade,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_id, agent_id)
);

create table if not exists public.request_responses (
  response_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.housing_requests(request_id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(agent_id) on delete cascade,
  message text not null,
  property_title text not null,
  property_location text not null,
  property_price text not null,
  property_images text[] not null default '{}',
  inspection_available boolean not null default false,
  status public.response_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (request_id, agent_id)
);

create table if not exists public.conversations (
  conversation_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.housing_requests(request_id) on delete cascade,
  home_seeker_user_id uuid not null references public.profiles(id) on delete cascade,
  agent_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_id, home_seeker_user_id, agent_user_id)
);

create table if not exists public.messages (
  message_id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(conversation_id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null references public.housing_requests(request_id) on delete cascade,
  message text not null,
  attachments text[] not null default '{}',
  created_at timestamptz not null default now(),
  read_status text not null default 'unread' check (read_status in ('unread', 'read'))
);

create table if not exists public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  payment_id uuid primary key default gen_random_uuid(),
  request_id uuid references public.housing_requests(request_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric not null,
  currency text not null default 'NGN',
  status text not null default 'pending',
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_properties (
  saved_id uuid primary key default gen_random_uuid(),
  home_seeker_id uuid not null references public.home_seeker_profiles(home_seeker_id) on delete cascade,
  response_id uuid references public.request_responses(response_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  review_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.housing_requests(request_id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(agent_id) on delete cascade,
  home_seeker_id uuid not null references public.home_seeker_profiles(home_seeker_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, agent_id, home_seeker_id)
);

create table if not exists public.reports (
  report_id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  request_id uuid references public.housing_requests(request_id) on delete set null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_home_seekers_updated_at on public.home_seeker_profiles;
create trigger touch_home_seekers_updated_at before update on public.home_seeker_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_agents_updated_at on public.agent_profiles;
create trigger touch_agents_updated_at before update on public.agent_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_requests_updated_at on public.housing_requests;
create trigger touch_requests_updated_at before update on public.housing_requests
for each row execute function public.touch_updated_at();

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
  select agent.user_id, 'new_housing_request', 'New matching housing request is available.'
  from public.request_matches match
  join public.agent_profiles agent on agent.agent_id = match.agent_id
  where match.request_id = target_request_id;
end;
$$;

create or replace function public.create_conversation_for_response(target_request_id uuid, target_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  seeker_user uuid;
  agent_user uuid;
begin
  select seeker.user_id into seeker_user
  from public.housing_requests req
  join public.home_seeker_profiles seeker on seeker.home_seeker_id = req.home_seeker_id
  where req.request_id = target_request_id;

  select user_id into agent_user from public.agent_profiles where agent_id = target_agent_id;

  if seeker_user is null or agent_user is null then return; end if;

  insert into public.conversations (request_id, home_seeker_user_id, agent_user_id)
  values (target_request_id, seeker_user, agent_user)
  on conflict (request_id, home_seeker_user_id, agent_user_id) do nothing;

  insert into public.notifications (user_id, type, message)
  values (seeker_user, 'agent_response', 'An agent responded to your housing request.');
end;
$$;

alter table public.profiles enable row level security;
alter table public.home_seeker_profiles enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.housing_requests enable row level security;
alter table public.request_matches enable row level security;
alter table public.request_responses enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.saved_properties enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "seekers manage own profile" on public.home_seeker_profiles;
create policy "seekers manage own profile" on public.home_seeker_profiles for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "agents manage own profile" on public.agent_profiles;
create policy "agents manage own profile" on public.agent_profiles for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "approved agents readable for seekers" on public.agent_profiles;
create policy "approved agents readable for seekers" on public.agent_profiles for select
using (kyc_status = 'approved' and suspended = false);

drop policy if exists "seekers manage own requests" on public.housing_requests;
create policy "seekers manage own requests" on public.housing_requests for all
using (
  exists (
    select 1 from public.home_seeker_profiles seeker
    where seeker.home_seeker_id = housing_requests.home_seeker_id
      and seeker.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.home_seeker_profiles seeker
    where seeker.home_seeker_id = housing_requests.home_seeker_id
      and seeker.user_id = auth.uid()
  )
);

drop policy if exists "approved agents read matched requests" on public.housing_requests;
create policy "approved agents read matched requests" on public.housing_requests for select
using (
  exists (
    select 1
    from public.agent_profiles agent
    where agent.user_id = auth.uid()
      and agent.kyc_status = 'approved'
      and agent.suspended = false
      and housing_requests.preferred_location = any(agent.operating_locations)
      and housing_requests.property_type = any(agent.property_specialties)
  )
);

drop policy if exists "agents read own matches" on public.request_matches;
create policy "agents read own matches" on public.request_matches for select
using (
  exists (
    select 1 from public.agent_profiles agent
    where agent.agent_id = request_matches.agent_id and agent.user_id = auth.uid()
  )
);

drop policy if exists "responses visible to participants" on public.request_responses;
create policy "responses visible to participants" on public.request_responses for select
using (
  exists (
    select 1 from public.agent_profiles agent
    where agent.agent_id = request_responses.agent_id and agent.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.housing_requests req
    join public.home_seeker_profiles seeker on seeker.home_seeker_id = req.home_seeker_id
    where req.request_id = request_responses.request_id and seeker.user_id = auth.uid()
  )
);

drop policy if exists "approved agents insert responses" on public.request_responses;
create policy "approved agents insert responses" on public.request_responses for insert
with check (
  exists (
    select 1 from public.agent_profiles agent
    where agent.agent_id = request_responses.agent_id
      and agent.user_id = auth.uid()
      and agent.kyc_status = 'approved'
      and agent.suspended = false
  )
);

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations for select
using (auth.uid() in (home_seeker_user_id, agent_user_id));

drop policy if exists "participants manage messages" on public.messages;
create policy "participants manage messages" on public.messages for all
using (auth.uid() in (sender_id, receiver_id))
with check (auth.uid() = sender_id);

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments" on public.payments for select using (auth.uid() = user_id);

drop policy if exists "users insert own payments" on public.payments;
create policy "users insert own payments" on public.payments for insert with check (auth.uid() = user_id);

drop policy if exists "seekers manage saved properties" on public.saved_properties;
create policy "seekers manage saved properties" on public.saved_properties for all
using (
  exists (
    select 1 from public.home_seeker_profiles seeker
    where seeker.home_seeker_id = saved_properties.home_seeker_id and seeker.user_id = auth.uid()
  )
);

drop policy if exists "participants read reviews" on public.reviews;
create policy "participants read reviews" on public.reviews for select using (true);

drop policy if exists "seekers insert reviews" on public.reviews;
create policy "seekers insert reviews" on public.reviews for insert with check (
  exists (
    select 1 from public.home_seeker_profiles seeker
    where seeker.home_seeker_id = reviews.home_seeker_id and seeker.user_id = auth.uid()
  )
);

drop policy if exists "users create reports" on public.reports;
create policy "users create reports" on public.reports for insert with check (auth.uid() = reporter_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.notifications';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_matches'
    ) then
      execute 'alter publication supabase_realtime add table public.request_matches';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_responses'
    ) then
      execute 'alter publication supabase_realtime add table public.request_responses';
    end if;
  end if;
end;
$$;



-- ============================================================================
-- Source: supabase/migrations/002_agent_subscription_tiers.sql
-- ============================================================================
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



-- ============================================================================
-- Source: supabase/migrations/003_admin_hero_and_kyc_uploads.sql
-- ============================================================================
-- Admin-managed hero slides and KYC upload metadata.
-- Safe additive migration. Does not remove or rename existing tables/columns.

alter table public.agent_profiles
  add column if not exists terms_accepted_at timestamptz;

create table if not exists public.hero_slides (
  slide_id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 1,
  image_url text not null default '/images/homelink-logo.png',
  kicker text not null,
  title text not null,
  copy text not null,
  primary_label text not null,
  primary_url text not null,
  secondary_label text not null,
  secondary_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_hero_slides_updated_at on public.hero_slides;
create trigger touch_hero_slides_updated_at before update on public.hero_slides
for each row execute function public.touch_updated_at();

insert into public.hero_slides (
  sort_order,
  image_url,
  kicker,
  title,
  copy,
  primary_label,
  primary_url,
  secondary_label,
  secondary_url,
  is_active
)
select *
from (
  values
    (
      1,
      '/images/homelink-logo.png',
      'Request a Home. Get Matched Fast.',
      'Submit your apartment request. Verified agents respond.',
      'Tell HomeLink your location, apartment type, bedrooms, budget, rent duration, and move-in date.',
      'Request a Home',
      '/auth/signup?type=home_seeker',
      'Join as Agent',
      '/auth/signup?type=agent',
      true
    ),
    (
      2,
      '/images/homelink-logo.png',
      'Verified agents only',
      'Approved agents receive matching requests instantly.',
      'Agents complete KYC and only receive requests inside their approved operating locations and specialties.',
      'Start Agent Onboarding',
      '/auth/signup?type=agent',
      'How It Works',
      '/#how',
      true
    ),
    (
      3,
      '/images/homelink-logo.png',
      'Compare. Chat. Inspect.',
      'Chat with agents and move faster.',
      'Compare responses, chat, call, WhatsApp, inspect, and mark your request fulfilled.',
      'Create Account',
      '/auth/signup',
      'Learn More',
      '/#about',
      true
    )
) as defaults (
  sort_order,
  image_url,
  kicker,
  title,
  copy,
  primary_label,
  primary_url,
  secondary_label,
  secondary_url,
  is_active
)
where not exists (select 1 from public.hero_slides);

alter table public.hero_slides enable row level security;

drop policy if exists "active hero slides are public" on public.hero_slides;
create policy "active hero slides are public" on public.hero_slides for select
using (is_active = true);



-- ============================================================================
-- Source: supabase/migrations/004_testimonials_management.sql
-- ============================================================================
-- Admin-managed testimonials for HomeLink by V-A.V.
-- Safe additive migration. Does not remove or rename existing tables/columns.

create table if not exists public.testimonials (
  testimonial_id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  location text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  message text not null,
  profile_photo text,
  is_featured boolean not null default false,
  is_approved boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_testimonials_updated_at on public.testimonials;
create trigger touch_testimonials_updated_at before update on public.testimonials
for each row execute function public.touch_updated_at();

insert into public.testimonials (
  name,
  role,
  location,
  rating,
  message,
  profile_photo,
  is_featured,
  is_approved,
  is_enabled
)
select *
from (
  values
    (
      'Mariam A.',
      'Home seeker',
      'Yaba, Lagos',
      5,
      'I stopped jumping from one agent to another. I sent one request and got clear responses from agents who actually understood my budget.',
      null,
      true,
      true,
      true
    ),
    (
      'Tunde Bello',
      'Verified agent',
      'Ibadan, Oyo',
      5,
      'HomeLink gives me serious clients in my area. The request details are clear, so I can respond with the right apartment fast.',
      null,
      true,
      true,
      true
    ),
    (
      'Chinwe Okafor',
      'Home seeker',
      'Lekki, Lagos',
      4,
      'The best part was comparing agent responses before making calls. It made the search feel calmer and more transparent.',
      null,
      false,
      true,
      true
    )
) as defaults (
  name,
  role,
  location,
  rating,
  message,
  profile_photo,
  is_featured,
  is_approved,
  is_enabled
)
where not exists (select 1 from public.testimonials);

alter table public.testimonials enable row level security;

drop policy if exists "approved testimonials are public" on public.testimonials;
create policy "approved testimonials are public" on public.testimonials for select
using (is_approved = true and is_enabled = true);
