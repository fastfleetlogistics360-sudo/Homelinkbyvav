# HomeLink by V-A.V

**Request a Home. Get Matched Fast.**

HomeLink by V-A.V is a mobile-first property-matching platform for two public user types:

- **Home Seekers** create apartment requests, pay a routing fee, receive agent responses, message agents, and track transactions.
- **Agents** complete KYC, receive matching apartment requests, respond with property options, manage matches, and upgrade subscription plans.

The app is a real Next.js/Supabase/Paystack build. It is not a localStorage demo. Authentication, role protection, request matching, payments, referrals, messages, notifications, admin tools, and subscription quota logic are wired through Supabase tables, server actions, API routes, and Postgres functions.

## Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **UI:** React server components, client components where interaction is needed, Lucide icons, CSS in `app/globals.css`
- **Auth:** Supabase Auth
- **Database:** Supabase Postgres with RLS policies
- **Storage:** Supabase Storage for admin hero/testimonial images and agent KYC files
- **Payments:** Paystack transaction initialize, verify, account resolve, and bank lookup APIs
- **Admin:** Protected admin workspace at `/admin`
- **PWA:** Web manifest, app icons, service worker registration, global back button

## Important Paths

| Area | Path |
| --- | --- |
| Root layout | `app/layout.tsx` |
| Global styles | `app/globals.css` |
| Public landing page | `app/page.tsx` |
| Auth pages/actions | `app/auth/*`, `lib/actions/auth.ts` |
| Agent dashboard pages | `app/dashboard/agent/*` |
| Home seeker dashboard pages | `app/dashboard/seeker/*` |
| Referral page | `app/dashboard/referrals/page.tsx`, `components/referrals-page-client.tsx` |
| Referral service | `lib/referrals.ts` |
| Agent matching service | `lib/agents.ts` |
| Agent plans/helpers | `lib/constants.ts`, `lib/agent-plans.ts` |
| Paystack routes/helpers | `app/api/paystack/*`, `lib/paystack.ts` |
| Admin actions/auth | `lib/actions/admin.ts`, `lib/admin-auth.ts` |
| Supabase migrations | `supabase/migrations/*.sql` |
| Full schema snapshot | `supabase/homelink_all_in_one_schema.sql` |

## Environment Setup

Create `.env.local` and provide the required secrets:

```env
NEXT_PUBLIC_APP_URL=https://homelinkbyvav.vercel.app
NEXT_PUBLIC_REFERRAL_BASE_URL=https://homelinkbyvav.com

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=

REQUEST_ROUTING_FEE_NAIRA=1000

ADMIN_EMAILS=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Notes:

- `NEXT_PUBLIC_APP_URL` is used for auth callback and Paystack callback URLs.
- `NEXT_PUBLIC_REFERRAL_BASE_URL` controls generated referral links. If missing, the referral service falls back to `https://homelinkbyvav.com`.
- `REQUEST_ROUTING_FEE_NAIRA` defaults to `1000` if not set.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.

Install and run:

```sh
npm install
npm run dev
```

Useful validation commands:

```sh
npm run typecheck
npm run build
git diff --check
```

## Supabase Setup

Run the migrations in order on a fresh Supabase project:

```txt
supabase/migrations/001_homelink_schema.sql
supabase/migrations/002_agent_subscription_tiers.sql
supabase/migrations/003_admin_hero_and_kyc_uploads.sql
supabase/migrations/004_testimonials_management.sql
supabase/migrations/005_referral_rewards.sql
supabase/migrations/006_fix_agent_weekly_usage_increment.sql
```

The repo also contains `supabase/homelink_all_in_one_schema.sql`, which is a combined schema snapshot.

In Supabase Auth settings, configure:

```txt
Site URL: https://homelinkbyvav.vercel.app
Redirect URLs:
https://homelinkbyvav.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

## Data Model

Main tables from `001_homelink_schema.sql`:

- `profiles`: shared auth profile, account type, name, email.
- `home_seeker_profiles`: home seeker-specific profile details.
- `agent_profiles`: agent profile, KYC status, plan, quota, locations, specialties, suspension state.
- `housing_requests`: seeker apartment requests.
- `request_matches`: computed agent/request matches.
- `request_responses`: agent property responses to requests.
- `conversations`: one conversation per matched response/request pair.
- `messages`: direct messages between request participants.
- `notifications`: in-app notification list.
- `payments`: Paystack payment records.
- `saved_properties`: saved property references.
- `reviews`: user reviews.
- `reports`: user reports.

Subscription functions from `002_agent_subscription_tiers.sql` and `006_fix_agent_weekly_usage_increment.sql`:

- `refresh_agent_subscription`
- `reset_agent_weekly_quota`
- `agent_can_accept_request`
- `increment_agent_weekly_usage`
- `apply_agent_subscription`
- `match_agents_for_request`
- `notify_matched_agents`

Referral tables from `005_referral_rewards.sql`:

- `referral_codes`
- `referrals`
- `referral_wallets`
- `credit_rewards`
- `withdrawal_requests`

Referral functions:

- `apply_referral_cash_reward`
- `create_referral_withdrawal_request`
- `approve_referral_withdrawal`

Content-management tables:

- `hero_slides`
- `testimonials`

## Authentication And Roles

There are only two public account types:

- `home_seeker`
- `agent`

Admin is not a public account type. Admin access is controlled by `ADMIN_EMAILS`, the default admin email in `lib/constants.ts`, and the admin session helper in `lib/admin-auth.ts`.

Auth flow:

1. Signup page renders `HomeSeekerSignupFlow`.
2. `signUpAction` validates data with Zod.
3. Supabase Auth creates the user.
4. `profiles` is upserted.
5. Either `home_seeker_profiles` or `agent_profiles` is created/upserted.
6. `ensureReferralCode` and `ensureReferralWallet` run for the new user.
7. If the signup came through a referral link, `recordReferralSignup` creates a pending referral.
8. User is redirected to login with an email verification message.

Role guards:

- `requireUser()` redirects unauthenticated users to `/auth/login`.
- `requireAccountType("agent")` protects agent pages.
- `requireAccountType("home_seeker")` protects seeker pages.
- If a user opens the wrong dashboard, they are redirected to the correct one based on `profiles.account_type`.

## Page And UI Component Map

### Root Layout

`app/layout.tsx`

Uses:

- `AppBackButton`: fixed global back button.
- `ServiceWorkerRegister`: registers service worker/PWA behavior.
- Metadata from `APP_NAME` and `TAGLINE`.

### Landing Page

`app/page.tsx`

Uses:

- `Header`
- `HeroSlider`
- `TestimonialsSection`
- `Footer`
- Lucide icons for feature cards
- Plan badges from `getPlanBadge`

Purpose:

- Public introduction to HomeLink.
- Shows property categories, agent plan highlights, trust/safety messaging, CTA links, hero slides, and testimonials.

### Login Page

`app/auth/login/page.tsx`

Uses:

- `Header`
- `Footer`
- `PasswordField`
- `loginAction`

Purpose:

- Authenticates existing Supabase users.
- Redirects agents to `/dashboard/agent`.
- Redirects home seekers to `/dashboard/seeker`.

### Signup Page

`app/auth/signup/page.tsx`

Uses:

- `HomeSeekerSignupFlow`
- `signUpAction`

Purpose:

- Handles both home seeker and agent signup from one multi-step flow.
- Accepts `?type=agent` or `?type=home_seeker`.
- Accepts `?ref=CODE` and passes it into a hidden `referral_code` form field.

### Agent Dashboard

`app/dashboard/agent/page.tsx`

Uses:

- `DashboardNotifications`
- `MobileDrawerMenu`
- `ReferralDashboardCard`
- Agent hero UI classes: `agent-dashboard-ui`, `agent-hero-reference`, `agent-stat-grid`, `agent-stat-card`
- Mobile bottom nav class: `mobile-bottom-nav agent`

Purpose:

- Shows KYC progress hero.
- Shows stats for new requests, responses, active matches, and total responses.
- Shows Refer & Earn summary card.
- Shows KYC status card.
- Shows quick actions.
- Shows compact properties/transactions/reviews preview sections.

### Agent Requests

`app/dashboard/agent/requests/page.tsx`

Uses:

- `DashboardShell`
- `AgentSubscriptionCard`
- `AgentRequestsBoard`
- `getOpenMatchingRequestsForAgent`

Purpose:

- Shows approved agents matching housing requests.
- Blocks unapproved agents with a KYC-required state.
- Shows subscription/quota status before request list.
- Lets agents submit property responses via server action.

### Agent Matches

`app/dashboard/agent/matches/page.tsx`

Uses:

- `DashboardShell`
- `AgentMatchesBoard`

Purpose:

- Shows agent request responses and related conversations.
- Allows the agent to track matched/accepted responses.

### Agent Messages

`app/dashboard/agent/messages/page.tsx`

Uses:

- `DashboardShell`
- `DashboardMessagesBoard`
- `getDashboardConversations`

Purpose:

- Shows conversation list and direct message thread UI for agents.
- Messages are scoped to conversations where the agent is a participant.

### Agent Profile

`app/dashboard/agent/profile/page.tsx`

Uses:

- `DashboardShell`
- `AgentProfileActions`
- Plan helpers: `planForAgent`, `getPlanBadge`
- KYC helpers: `isAgentKycApproved`, `normalizeKycStatus`

Purpose:

- Shows agency profile, plan, KYC status, operating areas, specialties, contact details, and profile actions.

### Agent KYC

`app/dashboard/agent/kyc/page.tsx`

Uses:

- `DashboardShell`
- `AgentKycForm`
- `saveAgentKycAction`
- Supabase Storage upload helpers

Purpose:

- Lets agents submit agency info, phone/WhatsApp, profile photo, verification documents, operating locations, property specialties, and terms acceptance.
- KYC can be `pending`, `approved`, or `rejected`.
- Approved KYC automatically syncs matching open requests for the agent.

### Agent Subscription

`app/dashboard/agent/subscription/page.tsx`

Uses:

- `DashboardShell`
- `AgentSubscriptionCard`
- `AGENT_PLANS`
- Paystack upgrade links

Purpose:

- Shows current plan and remaining weekly quota.
- Shows Free/Premium/Platinum plan cards.
- Shows feature comparison.
- Shows quota exhausted or payment verified/failed status panels.

### Home Seeker Dashboard

`app/dashboard/seeker/page.tsx`

Uses:

- `DashboardNotifications`
- `MobileDrawerMenu`
- `ReferralDashboardCard`
- `SeekerBottomNav`
- Agent dashboard visual properties via `agent-dashboard-ui seeker-dashboard-ui`
- Agent-style hero/stats/quick-action classes

Purpose:

- Shows seeker overview using the same visual system as the agent dashboard.
- Shows request count, active match count, agent response count.
- Shows Refer & Earn card.
- Shows quick actions for new request, request progress, and transactions.
- Keeps navbar pages separate so page content only loads when the user opens the relevant route.

### Seeker Requests

`app/dashboard/seeker/requests/page.tsx`

Uses:

- `DashboardShell` with `agent-compact-shell seeker-compact-shell`
- `SeekerDashboardReferenceSections`
- `SeekerBottomNav`

Purpose:

- Shows seeker request cards, matched status, agent responses, call/WhatsApp/message actions, and request progress UI.
- Data comes from `housing_requests` and nested `request_responses`.

### New Seeker Request

`app/dashboard/seeker/requests/new/page.tsx`

Uses:

- `DashboardShell`
- `SeekerBottomNav`
- `createHousingRequestAction`
- `NIGERIA_STATES`, `PROPERTY_TYPES`, `RENT_DURATIONS`

Purpose:

- Creates a new apartment request.
- Redirects to Paystack routing-fee initialization after saving the request.

### Seeker Messages

`app/dashboard/seeker/messages/page.tsx`

Uses:

- `DashboardShell`
- `DashboardMessagesBoard`
- `SeekerBottomNav`
- `getDashboardConversations`

Purpose:

- Shows seeker message list first, then the selected DM thread.
- Conversations are only visible to the seeker and the matching agent.

### Seeker Transactions

`app/dashboard/seeker/transactions/page.tsx`

Uses:

- `DashboardShell`
- `SeekerDashboardReferenceSections`
- `SeekerBottomNav`

Purpose:

- Shows payment history from `payments`.
- Displays totals, pending/completed status, and transaction cards.

### Seeker Profile

`app/dashboard/seeker/profile/page.tsx`

Uses:

- `DashboardShell`
- `SeekerDashboardReferenceSections`
- `SeekerBottomNav`

Purpose:

- Shows seeker profile card, profile stats, saved listing count, and profile menu-style actions.

### Refer & Earn Page

`app/dashboard/referrals/page.tsx`

Uses:

- `ReferralsPageClient`
- `DashboardNotifications`
- Agent/seeker nav based on account type
- `getReferralOverview`
- `requestWithdrawalAction`

Purpose:

- Dedicated referral page for both agents and seekers.
- Shows hero banner, referral statistics, how-you-earn tabs, referral link card, wallet, withdrawal workflow, credit rewards, badges, leaderboard, and history.

### Admin Dashboard

`app/admin/page.tsx`

Uses:

- `adminLoginAction`, `adminLogoutAction`
- `updateAgentKycStatusAction`
- `approveReferralWithdrawalAction`
- `saveHeroSlideAction`
- `saveTestimonialAction`
- `updateTestimonialStatusAction`
- `deleteTestimonialAction`
- `getReferralAdminData`

Purpose:

- Admin login/session management.
- KYC approval/rejection.
- Hero slide management.
- Testimonial management.
- Referral management, metrics, withdrawal approval, liability overview, and top referrers.

## Shared UI Components

| Component | Purpose |
| --- | --- |
| `DashboardShell` | Shared dashboard layout with brand header, desktop sidebar, mobile drawer trigger, and main content grid. |
| `MobileDrawerMenu` | Mobile menu used across dashboard contexts. |
| `DashboardNotifications` | Notification bell and dropdown. |
| `AppBackButton` | Fixed top-left back navigation button. |
| `ReferralDashboardCard` | Compact dashboard referral summary card used on agent and seeker dashboards. |
| `ReferralsPageClient` | Full interactive referral page with tabs, copy/share buttons, wallet modal, and withdrawal form. |
| `SeekerBottomNav` | Mobile bottom navigation for seeker pages. It now uses the same visual class as agent bottom nav. |
| `DashboardMessagesBoard` | Message list and direct-message thread experience for both account types. |
| `SeekerDashboardReferenceSections` | Reusable seeker request, transaction, profile, and progress UI sections. |
| `AgentSubscriptionCard` | Current plan/quota card for agents. |
| `AgentRequestsBoard` | Available requests and property-response UI. |
| `AgentMatchesBoard` | Agent response/match overview. |
| `AgentKycForm` | KYC submission form and upload controls. |
| `AgentProfileActions` | Agent profile action controls. |
| `Header` / `Footer` | Public site chrome. |
| `HeroSlider` | Public hero/image slider. |
| `TestimonialsSection` | Public testimonial display. |
| `PasswordField` | Reusable password input. |

## Dashboard Navigation

Navigation definitions live in `lib/dashboard-nav.ts`.

Agent dashboard menu:

- Overview
- Available Requests
- KYC Verification
- Subscription
- Refer & Earn
- Transaction History
- Messages
- Profile

Home seeker dashboard menu:

- Overview
- Create Apartment Request
- Refer & Earn
- Transaction History
- Messages
- Profile Settings

Seeker bottom navigation is implemented in `components/seeker-bottom-nav.tsx`:

- Dashboard -> `/dashboard/seeker`
- Requests -> `/dashboard/seeker/requests`
- Messages -> `/dashboard/seeker/messages`
- Refer -> `/dashboard/referrals`
- Transactions -> `/dashboard/seeker/transactions`
- Profile -> `/dashboard/seeker/profile`

Agent bottom navigation is defined directly in `app/dashboard/agent/page.tsx`:

- Dashboard -> `/dashboard/agent`
- Requests -> `/dashboard/agent/requests`
- Matches -> `/dashboard/agent/matches`
- Refer -> `/dashboard/referrals`
- Messages -> `/dashboard/agent/messages`
- Profile -> `/dashboard/agent/profile`

## How Home Seeker Requests Work

Code path:

- Form: `app/dashboard/seeker/requests/new/page.tsx`
- Action: `createHousingRequestAction` in `lib/actions/requests.ts`
- Matching: `matchAgentsForRequest` in `lib/agents.ts`
- Payment: `/api/paystack/initialize?request_id=...`
- Verification: `/api/paystack/verify`

Flow:

1. Home seeker creates an apartment request.
2. `housing_requests` row is inserted with `status = "pending"`.
3. `matchAgentsForRequest(request_id)` runs once without notifications.
4. User is redirected to Paystack for the routing fee.
5. Paystack callback hits `/api/paystack/verify`.
6. If paid, payment row becomes `paid`.
7. Matching runs again with `notify: true`.
8. Matched agents receive notifications.
9. If the paying user was referred, `qualifyHomeSeekerReferral(user_id)` may add the cash reward to the referrer's wallet.

Matching rules:

- Agent must be KYC approved.
- Agent must not be suspended.
- Agent property specialty must match request property type.
- Agent operating state/city/area must match request preferred location or area.
- Open request statuses are `pending` and `matched`.

## How Agent Responses Work

Code path:

- Board: `AgentRequestsBoard`
- Action: `createRequestResponseAction` in `lib/actions/agent.ts`
- Quota helpers: `lib/agent-plans.ts`, Postgres RPC functions

Flow:

1. Agent must be authenticated as `agent`.
2. Agent must have approved KYC.
3. System resets weekly quota if needed.
4. System checks `agent_can_accept_request`.
5. If quota is exhausted, user is redirected to `/dashboard/agent/subscription?quota=exhausted`.
6. Agent response is inserted into `request_responses`.
7. Weekly usage increments through `increment_agent_weekly_usage`.
8. A fallback admin update runs if the RPC does not increment correctly.
9. Request status updates to `accepted`.
10. `create_conversation_for_response` creates or ensures a conversation.
11. Dashboard, requests, subscription, and profile routes are revalidated.

## Messaging

Code path:

- Shared UI: `DashboardMessagesBoard`
- Data loader: `getDashboardConversations` in `lib/messages.ts`
- Send action: `sendConversationMessageAction` in `lib/actions/messages.ts`

Behavior:

- Conversations are loaded from `conversations`.
- Messages are loaded as nested `messages`.
- Agent sees home seeker as counterpart.
- Home seeker sees agent/agency as counterpart.
- Sending a message checks that the current user is either `home_seeker_user_id` or `agent_user_id`.
- Receiver is inferred from the conversation participants.
- Message rows are inserted into `messages`.

## Agent KYC

Code path:

- Page: `app/dashboard/agent/kyc/page.tsx`
- Form: `components/agent-kyc-form.tsx`
- Action: `saveAgentKycAction` in `lib/actions/agent.ts`
- Status helpers: `lib/kyc.ts`

KYC stores:

- Agency name
- Phone
- WhatsApp
- Profile photo
- Verification documents
- Operating locations
- Property specialties
- Terms acceptance timestamp
- KYC status

KYC status logic:

- `normalizeKycStatus` treats `approved` and legacy `verified` as approved.
- `isAgentKycApproved` also checks that the agent is not suspended.
- KYC progress is calculated from five steps: account exists, personal contact info, agency name, location/specialty selection, document/photo upload.

Admin approval:

- Admin action `updateAgentKycStatusAction` updates `agent_profiles.kyc_status`.
- Approval triggers `matchOpenRequestsForAgent`.
- Approval also calls `qualifyAgentReferral(agent.user_id)` for referred agents.
- Agent receives a notification.

## Agent Subscription System

Plan config lives in `lib/constants.ts`.

| Plan | Price | Weekly acceptances | Rank | Badge |
| --- | ---: | ---: | ---: | --- |
| Free Agent | ₦0 | 10 | 1 | none |
| Premium Agent | ₦2,500/month | 50 | 2 | Premium Agent |
| Platinum Agent | ₦7,500/month | Unlimited | 3 | Platinum Agent |

Helpers live in `lib/agent-plans.ts`:

- `normalizeAgentPlan`
- `planForAgent`
- `getPlanBadge`
- `getWeeklyLimit`
- `getRemainingQuota`
- `getQuotaLabel`
- `getDaysUntilReset`
- `sortAgentsByPlanRank`

Payment flow:

1. Agent clicks Premium or Platinum upgrade.
2. Link opens `/api/paystack/initialize?plan=premium` or `/api/paystack/initialize?plan=platinum`.
3. Initialize route confirms current user is an agent.
4. It creates a pending `payments` row with `provider_payload.product = "agent_subscription"`.
5. It initializes Paystack with plan metadata.
6. Paystack redirects to `/api/paystack/verify?reference=...`.
7. Verify route checks Paystack.
8. If paid, it calls `apply_agent_subscription`.
9. Plan becomes active for 30 days.
10. Agent is redirected to `/dashboard/agent/subscription?payment=verified`.

Quota flow:

1. `getRefreshedAgentProfile` calls `reset_agent_weekly_quota`.
2. Free and Premium agents have weekly usage limits.
3. Platinum returns unlimited quota.
4. `createRequestResponseAction` checks `agent_can_accept_request`.
5. `increment_agent_weekly_usage` increments accepted usage.
6. Migration `006_fix_agent_weekly_usage_increment.sql` fixes the usage increment function so accepted requests update correctly.

Ranking:

- `sortAgentsByPlanRank` ranks Platinum above Premium above Free.
- Notifications differ by plan:
  - Free: in-app request notification.
  - Premium: email-alert type notification.
  - Platinum: priority/SMS-placeholder notification type.

## Paystack Integration

Files:

- `lib/paystack.ts`
- `app/api/paystack/initialize/route.ts`
- `app/api/paystack/verify/route.ts`
- `app/api/paystack/resolve-account/route.ts`

Supported Paystack operations:

- Initialize transaction.
- Verify transaction.
- List/match Nigerian banks.
- Resolve account number to account name.

Current payment products:

- `agent_connection_routing_fee` for home seeker request routing fee.
- `agent_subscription` for Premium/Platinum plan payments.

Payment records are stored in `payments` with:

- `request_id`
- `user_id`
- `provider`
- `reference`
- `amount`
- `currency`
- `status`
- `provider_payload`

## Refer & Earn System

Referral logic is in `lib/referrals.ts`.

Constants:

- Home seeker qualified referral reward: `₦200`
- Agent qualified referral reward: `₦500`
- Referred agent premium bonus: `+5 request credits`
- Minimum withdrawal: `₦2,000`
- Dashboard qualified target: `10`

### Referral Code Generation

Every user has a permanent referral code in `referral_codes`.

Generation path:

- `getReferralOverview(user.id)` calls `ensureReferralCode(user.id)`.
- `signUpAction` also calls `ensureReferralCode(data.user.id)` for newly created users.

If a code already exists, it is reused. If not, a new one is inserted.

Code format:

```txt
HL + first 3 characters of user id + random uppercase hex
```

The database enforces uppercase alphanumeric codes with length 6-16.

Referral URL:

```txt
{NEXT_PUBLIC_REFERRAL_BASE_URL}/r/{REFERRAL_CODE}
```

Fallback base URL:

```txt
https://homelinkbyvav.com
```

Existing accounts:

- They may not all have rows immediately after the migration.
- They automatically get a real code the first time they open a referral-enabled dashboard or `/dashboard/referrals`.
- Once generated, the code remains permanent.

### Referral Link Tracking

Route:

```txt
/r/[code]
```

Code path:

- `app/r/[code]/route.ts`

Flow:

1. User opens `/r/CODE`.
2. Code is normalized to uppercase alphanumeric.
3. App checks `referral_codes`.
4. If valid, user is redirected to `/auth/signup?ref=CODE`.
5. A `homelink_referral_code` HTTP-only cookie is set for 30 days.
6. Signup form includes hidden `referral_code`.
7. `signUpAction` uses form referral code or cookie referral code.
8. `recordReferralSignup` creates the referral relationship.

### Referral Signup Protection

`recordReferralSignup` blocks:

- Empty or invalid code.
- Self-referral.
- Duplicate referral for the same referred user.
- Same email as referrer.
- Same phone as referrer.
- Phone number already used in another referral.

Blocked referrals are inserted as `cancelled` with a reason where applicable.

Valid referrals start as `pending`.

### Home Seeker Referral Qualification

Reward:

```txt
₦200
```

A home seeker referral qualifies only after:

1. User signs up through a valid referral code.
2. Account is created.
3. User creates an apartment request.
4. User pays the routing fee.
5. Paystack verification succeeds.

Code path:

- `/api/paystack/verify`
- `qualifyHomeSeekerReferral(payment.user_id)`
- Postgres RPC `apply_referral_cash_reward`

When qualified:

- Referral status becomes `qualified`.
- `qualified_at` is set.
- Wallet `available_balance` increases.
- Wallet `total_earned` increases.
- Wallet `qualified_referrals` increases.
- Wallet `seeker_referrals` increases.
- Referrer receives a notification.

### Agent Referral Qualification

Reward:

```txt
₦500
```

An agent referral qualifies only after:

1. Agent signs up through a valid referral code.
2. Agent submits KYC.
3. Admin approves the agent KYC.

Code path:

- `updateAgentKycStatusAction`
- `qualifyAgentReferral(agent.user_id)`
- Postgres RPC `apply_referral_cash_reward`

When qualified:

- Referral status becomes `qualified`.
- Wallet balance and total earned increase.
- Wallet agent referral count increases.
- Referrer receives a notification.

### Agent Premium Bonus

Reward:

```txt
+5 request credits
```

This is not cash.

Flow:

1. Referred agent has already qualified as an agent referral.
2. Referred agent pays for Premium or Platinum.
3. Paystack verification succeeds.
4. `/api/paystack/verify` calls `grantAgentPremiumReferralBonus(metadata.user_id)`.
5. A row is inserted into `credit_rewards`.
6. Unique constraint on `(source, source_referral_id)` prevents duplicate premium bonuses.
7. Referrer receives a notification.

### Referral Wallet And Withdrawal

Wallet data:

- `available_balance`
- `total_earned`
- `total_paid`
- `qualified_referrals`
- `agent_referrals`
- `seeker_referrals`

Withdrawal rules:

- Minimum withdrawal is `₦2,000`.
- If balance is below minimum, the UI disables withdrawal and shows how much is still needed.
- If balance is enough, user can open the withdrawal modal.

Withdrawal action:

- File: `lib/actions/referrals.ts`
- Action: `requestWithdrawalAction`

Flow:

1. User enters bank name and account number.
2. App resolves account name with Paystack.
3. Server resolves again before submission.
4. Resolved account name must match `profiles.full_name`.
5. RPC `create_referral_withdrawal_request` moves available balance into a pending withdrawal request.
6. User gets a notification.
7. Admin can approve through `/admin`.
8. Approval calls `approve_referral_withdrawal`.
9. `total_paid` increases and qualified referrals linked before the withdrawal are marked `paid`.

### Referral UI

Dashboard card:

- Component: `ReferralDashboardCard`
- Used on agent and seeker dashboard landing pages.
- Shows total referrals, qualified referrals, pending referrals, available balance, request credits, progress, link copy, share links, animated carousel, badges, and CTA.

Dedicated page:

- Component: `ReferralsPageClient`
- Route: `/dashboard/referrals`
- Shows hero, stats, how-you-earn tabs, referral link card, wallet card, withdrawal modal, credit reward card, badges, leaderboard, and history.

Admin:

- `getReferralAdminData`
- `/admin` referral management section
- Shows total referrals, pending, qualified, paid, liability, top referrers, referral table, and withdrawal requests.

## Notifications

Notifications are stored in `notifications`.

Current notification examples:

- New matching request.
- Premium/Platinum request notifications.
- Referral signup.
- Referral qualified.
- Referral premium bonus granted.
- Withdrawal requested.
- Withdrawal approved.
- Agent KYC approved/rejected.

Dashboard notification UI:

- `DashboardNotifications`
- Used in the dashboard headers and referral page topbar.

## Admin System

Admin files:

- `app/admin/page.tsx`
- `lib/admin-auth.ts`
- `lib/actions/admin.ts`

Admin access:

- A user is admin if their email is in `ADMIN_EMAILS` or matches `DEFAULT_ADMIN_EMAIL`.
- Admin can authenticate through Supabase Auth.
- If Supabase login fails, a signed admin cookie can be created when the email is approved and password matches `ADMIN_PASSWORD` or the current default password fallback.
- Cookie is HTTP-only, SameSite lax, and secure in production.

Admin abilities:

- Approve/reject agent KYC.
- Trigger matching for newly approved agents.
- Qualify referred agents after approval.
- Manage hero slides.
- Manage testimonials.
- View referral metrics.
- Approve referral withdrawal requests.

## Styling And UI System

Main stylesheet:

```txt
app/globals.css
```

Core visual direction:

- Mobile-first dashboard layouts.
- Glassmorphism cards and panels.
- Navy/gold HomeLink brand palette.
- Agent dashboard UI properties reused across seeker pages.
- Compact dashboard shell for nested dashboard pages.
- Shared bottom nav styling for agent and seeker mobile navigation.
- Progress bars, stat cards, animated referral counters, hover states, and entrance reveal effects.

Key classes:

- `agent-dashboard-ui`
- `seeker-dashboard-ui`
- `agent-hero-reference`
- `agent-stat-grid`
- `agent-stat-card`
- `agent-compact-shell`
- `seeker-compact-shell`
- `mobile-bottom-nav agent`
- `referral-widget`
- `referrals-page-ui`
- `referral-panel`
- `referral-side-card`
- `dashboard`
- `dashboard-topbar`
- `dashboard-grid`

Recent sizing rules:

- `/dashboard/referrals` component scale is controlled by the final `.referrals-page-ui > :not(.mobile-bottom-nav)` rule.
- Seeker nested pages use `agent-compact-shell seeker-compact-shell` so they inherit the agent page sizing system.

## Security Already Present

- Supabase Auth protects private pages.
- `requireAccountType` prevents cross-role dashboard access.
- RLS policies protect most user-owned data.
- Service role client is only imported from server-side modules.
- Paystack transactions are verified server-side.
- Withdrawal account name is verified server-side, not only client-side.
- Referral self-referrals and duplicate rewards are blocked.
- Message sending verifies conversation participation.
- Admin session cookie is HTTP-only and HMAC-signed.
- Admin session comparison uses timing-safe equality.
- Referral withdrawal RPC locks wallet rows before moving balance.
- Subscription and referral reward RPCs use Postgres-side checks to avoid duplicate application.

## Security Fixes And Hardening To Add

These are recommended improvements based on the current code.

### 1. Remove Default Admin Password Fallback

Current code has `DEFAULT_ADMIN_PASSWORD` in `lib/constants.ts`.

Recommended:

- Require `ADMIN_PASSWORD` in production.
- Throw if missing in production.
- Remove or disable the hardcoded fallback password.
- Rotate existing admin password after deployment.

### 2. Add Paystack Webhook Verification

Current code verifies Paystack on callback by reference.

Recommended:

- Add `/api/paystack/webhook`.
- Validate `x-paystack-signature` using `PAYSTACK_SECRET_KEY`.
- Make payment fulfillment idempotent by reference.
- Treat callbacks as UX redirect only, and webhooks as source of truth.

### 3. Enforce Payment Amount And Product Verification

Current verifier trusts the stored payment metadata plus Paystack verification status.

Recommended:

- Compare verified Paystack amount against expected amount in kobo.
- Compare verified reference against stored reference.
- Compare verified metadata product/plan/request ownership.
- Reject verification if amount or product does not match stored `payments` row.

### 4. Add Rate Limiting

Add rate limits for:

- Login attempts.
- Signup attempts.
- Paystack initialize.
- Account resolve endpoint.
- Referral signup tracking.
- Message sending.
- Admin login.

Possible approaches:

- Upstash Redis rate limits.
- Supabase edge function/rate table.
- Vercel middleware with IP/user-keyed throttling.

### 5. Strengthen Admin Access

Recommended:

- Remove cookie fallback login if not needed.
- Require Supabase Auth admin user plus email allowlist.
- Add MFA at the identity provider level.
- Add audit logs for KYC approvals, withdrawal approvals, hero edits, and testimonial changes.

### 6. Add CSRF Protection For Sensitive Server Actions

Server actions rely on authenticated cookies.

Recommended:

- Add CSRF tokens for withdrawal, admin mutations, KYC updates, and message sending.
- Check origin/referer for sensitive form posts.
- Keep SameSite cookies strict where possible.

### 7. Validate File Uploads More Strictly

Recommended:

- Enforce allowed MIME types.
- Enforce maximum file size.
- Strip executable file types.
- Store private KYC documents in private buckets only.
- Generate signed URLs with short expiry for admin review.

### 8. Add Abuse Controls For Referrals

Current code blocks self-referral, duplicate referred user, same email, same phone, and repeated phone referrals.

Recommended:

- Add device/IP fingerprinting with privacy-safe hashing.
- Flag high-volume signups from same IP/device.
- Add admin review status for suspicious referrals.
- Delay cash withdrawal eligibility until referral account has aged or completed more actions.

### 9. Add Database Constraints For More Invariants

Recommended:

- Unique `request_responses(request_id, agent_id)` to prevent multiple responses by same agent for one request.
- Unique active subscription payment reference.
- Check constraints for non-empty referral code and valid statuses where missing.
- Stronger ownership checks in RPCs where possible.

### 10. Improve Secrets Hygiene

Recommended:

- Never commit `.env.local`.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if exposed.
- Rotate Paystack keys after staging/production transition.
- Use separate test and production Paystack/Supabase projects.

### 11. Add Monitoring And Audit Tables

Recommended tables:

- `admin_audit_logs`
- `payment_events`
- `referral_fraud_flags`
- `message_reports`
- `kyc_review_logs`

### 12. Add End-To-End Tests For High-Risk Flows

Recommended Playwright tests:

- Home seeker signup.
- Agent signup and KYC submission.
- Admin KYC approval.
- Request creation and Paystack mocked verification.
- Agent response and quota increment.
- Referral signup and qualification.
- Withdrawal request and admin approval.
- Mobile message list -> DM thread behavior.

## Production Checklist

Before launch:

- Run all migrations.
- Confirm RLS is enabled on all private tables.
- Confirm Supabase Auth redirect URLs.
- Confirm Paystack keys are production keys.
- Configure `NEXT_PUBLIC_APP_URL`.
- Configure `NEXT_PUBLIC_REFERRAL_BASE_URL`.
- Set `ADMIN_EMAILS`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
- Remove default admin password fallback for production.
- Test home seeker signup and email confirmation.
- Test agent signup, KYC upload, admin approval.
- Test request creation and Paystack payment.
- Test agent subscription upgrade.
- Test referral link signup and reward qualification.
- Test withdrawal account resolve and withdrawal request.
- Test mobile nav on seeker and agent dashboards.

## Known Operational Notes

- Existing users get referral codes lazily when they open a referral-enabled page.
- New users get referral code and wallet setup during signup.
- Agent KYC approval is admin-controlled.
- Free and Premium agent quotas reset weekly through database RPC logic.
- Platinum agents have unlimited request acceptance.
- Premium bonus credits are granted once per referred agent upgrade because of the unique `credit_rewards(source, source_referral_id)` constraint.
- The SMS notification path is currently a placeholder notification type for future provider integration.
- Paystack account name is resolved both from the client modal and again server-side before withdrawal creation.

## Development Commands

```sh
npm run dev
npm run typecheck
npm run build
```

No formal test suite is currently defined in `package.json`.

## Recommended Next Engineering Steps

1. Add Paystack webhook endpoint with signature validation.
2. Remove production admin password fallback.
3. Add audit logs for admin actions and payment fulfillment.
4. Add rate limiting to auth, payment, account resolve, and withdrawal endpoints.
5. Add E2E tests for referral/subscription/payment flows.
6. Add stricter upload validation for KYC documents.
7. Add an admin fraud-review workflow for suspicious referrals.
8. Add database uniqueness constraints for duplicate agent responses where product rules require it.
