-- Refer & Earn system for HomeLink by V-A.V.
-- Safe additive migration. Does not remove or rename existing tables/columns.

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  referral_code text not null unique,
  created_at timestamptz not null default now(),
  constraint referral_codes_format check (referral_code ~ '^[A-Z0-9]{6,16}$')
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  referred_user_type text not null check (referred_user_type in ('home_seeker', 'agent')),
  reward_amount numeric not null default 0 check (reward_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'qualified', 'paid', 'cancelled')),
  qualification_reason text,
  referred_email text,
  referred_phone text,
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint referrals_no_self_referral check (referrer_id <> referred_user_id)
);

create table if not exists public.referral_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  available_balance numeric not null default 0 check (available_balance >= 0),
  total_earned numeric not null default 0 check (total_earned >= 0),
  total_paid numeric not null default 0 check (total_paid >= 0),
  qualified_referrals integer not null default 0 check (qualified_referrals >= 0),
  agent_referrals integer not null default 0 check (agent_referrals >= 0),
  seeker_referrals integer not null default 0 check (seeker_referrals >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credits integer not null check (credits > 0),
  source text not null,
  source_referral_id uuid references public.referrals(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source, source_referral_id)
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists referral_codes_code_idx on public.referral_codes (referral_code);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id, status);
create index if not exists referrals_referred_idx on public.referrals (referred_user_id);
create index if not exists referrals_phone_idx on public.referrals (referred_phone) where referred_phone is not null;
create index if not exists referral_wallets_qualified_idx on public.referral_wallets (qualified_referrals desc);
create index if not exists withdrawal_requests_user_status_idx on public.withdrawal_requests (user_id, status);

drop trigger if exists touch_referrals_updated_at on public.referrals;
create trigger touch_referrals_updated_at before update on public.referrals
for each row execute function public.touch_updated_at();

drop trigger if exists touch_referral_wallets_updated_at on public.referral_wallets;
create trigger touch_referral_wallets_updated_at before update on public.referral_wallets
for each row execute function public.touch_updated_at();

create or replace function public.apply_referral_cash_reward(
  target_referral_id uuid,
  target_amount numeric,
  target_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_referral public.referrals;
begin
  select * into target_referral
  from public.referrals
  where id = target_referral_id
  for update;

  if not found or target_referral.status <> 'pending' then
    return false;
  end if;

  update public.referrals
  set
    status = 'qualified',
    reward_amount = target_amount,
    qualification_reason = target_reason,
    qualified_at = now()
  where id = target_referral_id;

  insert into public.referral_wallets (user_id)
  values (target_referral.referrer_id)
  on conflict (user_id) do nothing;

  update public.referral_wallets
  set
    available_balance = available_balance + target_amount,
    total_earned = total_earned + target_amount,
    qualified_referrals = qualified_referrals + 1,
    seeker_referrals = seeker_referrals + case when target_referral.referred_user_type = 'home_seeker' then 1 else 0 end,
    agent_referrals = agent_referrals + case when target_referral.referred_user_type = 'agent' then 1 else 0 end
  where user_id = target_referral.referrer_id;

  return true;
end;
$$;

create or replace function public.create_referral_withdrawal_request(
  target_user_id uuid,
  target_bank_name text,
  target_account_number text,
  target_account_name text,
  target_amount numeric,
  minimum_amount numeric default 2000
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wallet public.referral_wallets;
  withdrawal_id uuid;
begin
  select * into target_wallet
  from public.referral_wallets
  where user_id = target_user_id
  for update;

  if not found then
    raise exception 'Referral wallet not found.';
  end if;

  if target_wallet.available_balance < minimum_amount then
    raise exception 'Minimum withdrawal amount has not been reached.';
  end if;

  if target_amount <= 0 or target_amount > target_wallet.available_balance then
    raise exception 'Invalid withdrawal amount.';
  end if;

  update public.referral_wallets
  set available_balance = available_balance - target_amount
  where user_id = target_user_id;

  insert into public.withdrawal_requests (
    user_id,
    bank_name,
    account_number,
    account_name,
    amount,
    status
  )
  values (
    target_user_id,
    target_bank_name,
    target_account_number,
    target_account_name,
    target_amount,
    'pending'
  )
  returning id into withdrawal_id;

  return withdrawal_id;
end;
$$;

create or replace function public.approve_referral_withdrawal(target_withdrawal_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_withdrawal public.withdrawal_requests;
begin
  select * into target_withdrawal
  from public.withdrawal_requests
  where id = target_withdrawal_id
  for update;

  if not found or target_withdrawal.status <> 'pending' then
    return false;
  end if;

  update public.withdrawal_requests
  set status = 'approved', approved_at = now()
  where id = target_withdrawal_id;

  insert into public.referral_wallets (user_id)
  values (target_withdrawal.user_id)
  on conflict (user_id) do nothing;

  update public.referral_wallets
  set total_paid = total_paid + target_withdrawal.amount
  where user_id = target_withdrawal.user_id;

  update public.referrals
  set status = 'paid'
  where referrer_id = target_withdrawal.user_id
    and status = 'qualified'
    and qualified_at is not null
    and qualified_at <= target_withdrawal.created_at;

  insert into public.notifications (user_id, type, message)
  values (
    target_withdrawal.user_id,
    'referral_withdrawal_approved',
    'Your Refer & Earn withdrawal has been approved.'
  );

  return true;
end;
$$;

revoke execute on function public.apply_referral_cash_reward(uuid, numeric, text) from public, anon, authenticated;
revoke execute on function public.create_referral_withdrawal_request(uuid, text, text, text, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.approve_referral_withdrawal(uuid) from public, anon, authenticated;

grant execute on function public.apply_referral_cash_reward(uuid, numeric, text) to service_role;
grant execute on function public.create_referral_withdrawal_request(uuid, text, text, text, numeric, numeric) to service_role;
grant execute on function public.approve_referral_withdrawal(uuid) to service_role;

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_wallets enable row level security;
alter table public.credit_rewards enable row level security;
alter table public.withdrawal_requests enable row level security;

drop policy if exists "users read own referral code" on public.referral_codes;
create policy "users read own referral code" on public.referral_codes for select
using (auth.uid() = user_id);

drop policy if exists "users read related referrals" on public.referrals;
create policy "users read related referrals" on public.referrals for select
using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

drop policy if exists "users read own referral wallet" on public.referral_wallets;
create policy "users read own referral wallet" on public.referral_wallets for select
using (auth.uid() = user_id);

drop policy if exists "users read own credit rewards" on public.credit_rewards;
create policy "users read own credit rewards" on public.credit_rewards for select
using (auth.uid() = user_id);

drop policy if exists "users read own withdrawal requests" on public.withdrawal_requests;
create policy "users read own withdrawal requests" on public.withdrawal_requests for select
using (auth.uid() = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'referrals'
    ) then
      execute 'alter publication supabase_realtime add table public.referrals';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'referral_wallets'
    ) then
      execute 'alter publication supabase_realtime add table public.referral_wallets';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'withdrawal_requests'
    ) then
      execute 'alter publication supabase_realtime add table public.withdrawal_requests';
    end if;
  end if;
end;
$$;
