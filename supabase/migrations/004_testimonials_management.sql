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
