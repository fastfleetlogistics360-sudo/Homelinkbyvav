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

create policy "profiles read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

create policy "seekers manage own profile" on public.home_seeker_profiles for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "agents manage own profile" on public.agent_profiles for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "approved agents readable for seekers" on public.agent_profiles for select
using (kyc_status = 'approved' and suspended = false);

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

create policy "agents read own matches" on public.request_matches for select
using (
  exists (
    select 1 from public.agent_profiles agent
    where agent.agent_id = request_matches.agent_id and agent.user_id = auth.uid()
  )
);

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

create policy "participants read conversations" on public.conversations for select
using (auth.uid() in (home_seeker_user_id, agent_user_id));

create policy "participants manage messages" on public.messages for all
using (auth.uid() in (sender_id, receiver_id))
with check (auth.uid() = sender_id);

create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update using (auth.uid() = user_id);

create policy "users read own payments" on public.payments for select using (auth.uid() = user_id);
create policy "users insert own payments" on public.payments for insert with check (auth.uid() = user_id);

create policy "seekers manage saved properties" on public.saved_properties for all
using (
  exists (
    select 1 from public.home_seeker_profiles seeker
    where seeker.home_seeker_id = saved_properties.home_seeker_id and seeker.user_id = auth.uid()
  )
);

create policy "participants read reviews" on public.reviews for select using (true);
create policy "seekers insert reviews" on public.reviews for insert with check (
  exists (
    select 1 from public.home_seeker_profiles seeker
    where seeker.home_seeker_id = reviews.home_seeker_id and seeker.user_id = auth.uid()
  )
);

create policy "users create reports" on public.reports for insert with check (auth.uid() = reporter_id);

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.request_matches;
alter publication supabase_realtime add table public.request_responses;
