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
```

5. Start the app:

```sh
npm run dev
```

Then visit `http://localhost:3000`.

## Implemented

- Public landing page with full-image advert slider.
- Home Seeker signup/login.
- Agent signup/login.
- Role-based dashboard protection.
- Home Seeker request form.
- Paystack routing-fee initialization and verification.
- Agent KYC setup.
- Approved-agent-only request access.
- Matching by KYC approval, operating location, and property specialty.
- Agent request response form.
- Conversation/message, notification, payment, review, report, saved property, and admin tables in SQL.
- Admin page protected by configured admin emails.

## Supabase Notes

Run the SQL once on a fresh project. The migration enables RLS and creates policies so:

- Home seekers manage their own profile and requests.
- Agents manage their own profile.
- Only approved, unsuspended agents can read matching requests.
- Agents can only respond after approval.
- Participants can read conversations/messages.
- Paystack payment rows are tied to the current user.

## Paystack Flow

When a home seeker submits a housing request:

1. The request is saved in `housing_requests`.
2. Matching agents are calculated with `match_agents_for_request`.
3. The user is redirected to `/api/paystack/initialize?request_id=...`.
4. Paystack returns to `/api/paystack/verify`.
5. Successful verification updates `payments` and notifies matched agents.
