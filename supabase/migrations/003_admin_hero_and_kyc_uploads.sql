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
