# HomeLink by V-A.V

Request a Home. Get Matched Fast.

This project is now an app-ready Next.js MVP connected for Supabase and Paystack. It is no longer a localStorage/static demo.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, RLS, Realtime-ready tables
- Paystack payment initialization and verification routes
- TypeScript
- Lucide social icons

## Account Types

Only two public account types exist:

- Home Seeker
- Agent

Admin tools are protected by `ADMIN_EMAILS` and are not a third public account type.

## Setup

1. Install dependencies:

```sh
npm install
```

2. Copy env placeholders:

```sh
cp .env.example .env.local
```

3. Fill in:

```env
NEXT_PUBLIC_APP_URL=https://homelinkbyvav.vercel.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
ADMIN_EMAILS=
```

4. Open Supabase SQL Editor and run:

```sql
supabase/migrations/001_homelink_schema.sql
supabase/migrations/002_agent_subscription_tiers.sql
supabase/migrations/003_admin_hero_and_kyc_uploads.sql
supabase/migrations/004_testimonials_management.sql
```

5. Start the app:

```sh
npm run dev
```

Then visit `http://localhost:3000`.

## Supabase Auth Redirect Settings

In Supabase Dashboard, open `Authentication` → `URL Configuration`.

Set:

```txt
Site URL: https://homelinkbyvav.vercel.app
```

Add these redirect URLs:

```txt
https://homelinkbyvav.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

This prevents email verification links from going back to localhost after deployment.

## Implemented

- Public landing page with full-image advert slider.
- Home Seeker signup/login.
- Agent signup/login.
- Role-based dashboard protection.
- Home Seeker request form.
- Paystack routing-fee initialization and verification.
- Agent subscription tiers: Free, Premium, and Platinum.
- Weekly agent request acceptance quotas with reset helpers.
- Agent KYC setup.
- Approved-agent-only request access.
- Matching by KYC approval, operating location, and property specialty.
- Plan-aware agent ranking: Platinum, Premium, then Free.
- Agent request response form.
- Conversation/message, notification, payment, review, report, saved property, and admin tables in SQL.
- Admin page protected by configured admin emails.
- Admin workspace at `/admin` for KYC approval/rejection and homepage hero slide editing.
- Admin testimonial management for landing page social proof.
- Agent KYC upload form for profile pictures and verification documents.
- Mobile drawer menus for the public site and dashboards.
- PWA manifest, offline page, and service worker registration.

## Supabase Notes

Run the SQL once on a fresh project. The migration enables RLS and creates policies so:

- Home seekers manage their own profile and requests.
- Agents manage their own profile.
- Only approved, unsuspended agents can read matching requests.
- Agents can only respond after approval.
- Free agents can accept up to 10 requests per week.
- Premium agents can accept up to 50 requests per week.
- Platinum agents have unlimited request acceptance.
- Participants can read conversations/messages.
- Paystack payment rows are tied to the current user.
- Hero slider text, images, and CTA URLs are stored in `hero_slides`.
- Testimonials are stored in `testimonials` and only approved/enabled entries appear publicly.
- Agent terms acceptance is stored on `agent_profiles.terms_accepted_at`.

## Admin

Open `/admin` and sign in with a Supabase Auth user whose email is listed in `ADMIN_EMAILS`.
The default allowed admin email in code is:

```txt
olasunkanmijoshua765@gmail.com
```

Create that user in Supabase Auth with your admin password, then use `/admin` to approve/reject KYC and edit homepage hero slides.

## Paystack Flow

When a home seeker submits a housing request:

1. The request is saved in `housing_requests`.
2. Matching agents are calculated with `match_agents_for_request`.
3. The user is redirected to `/api/paystack/initialize?request_id=...`.
4. Paystack returns to `/api/paystack/verify`.
5. Successful verification updates `payments` and notifies matched agents.

When an agent upgrades:

1. The agent opens `/dashboard/agent/subscription`.
2. Premium and Platinum buttons call `/api/paystack/initialize?plan=premium` or `/api/paystack/initialize?plan=platinum`.
3. Paystack returns to `/api/paystack/verify`.
4. Successful verification calls `apply_agent_subscription`, resets the agent quota, and activates the plan for 30 days.
