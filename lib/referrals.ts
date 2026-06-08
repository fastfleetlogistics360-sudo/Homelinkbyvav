import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountType } from "@/lib/types";

export const HOME_SEEKER_REFERRAL_REWARD = 200;
export const AGENT_REFERRAL_REWARD = 500;
export const AGENT_PREMIUM_BONUS_CREDITS = 5;
export const REFERRAL_MIN_WITHDRAWAL_NAIRA = 2000;
export const REFERRAL_QUALIFIED_TARGET = 10;

export type ReferralStatus = "pending" | "qualified" | "paid" | "cancelled";

export type ReferralHistoryItem = {
  id: string;
  referredName: string;
  referredEmail: string;
  userType: "Home Seeker" | "Agent";
  status: ReferralStatus;
  reward: string;
  date: string;
};

export type ReferralLeaderboardItem = {
  rank: number;
  name: string;
  referrals: number;
  initials: string;
};

export type ReferralBadge = {
  name: "Bronze" | "Silver" | "Gold" | "Diamond";
  referrals: number;
  unlocked: boolean;
};

export type ReferralOverview = {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  availableBalance: number;
  totalPaid: number;
  requestCreditsEarned: number;
  withdrawalProgressPercent: number;
  qualifiedProgress: number;
  history: ReferralHistoryItem[];
  leaderboard: ReferralLeaderboardItem[];
  badges: ReferralBadge[];
  pendingWithdrawals: number;
};

type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referred_user_type: AccountType;
  reward_amount: number | string;
  status: ReferralStatus;
  qualification_reason: string | null;
  created_at: string;
  qualified_at: string | null;
};

type ProfileRow = {
  id: string;
  account_type: AccountType;
  full_name: string;
  email: string;
};

type WalletRow = {
  user_id: string;
  available_balance: number | string;
  total_earned: number | string;
  total_paid: number | string;
  qualified_referrals: number;
  agent_referrals: number;
  seeker_referrals: number;
};

export type ReferralAdminRow = {
  id: string;
  referrer: string;
  referredUser: string;
  referralCode: string;
  userType: string;
  rewardAmount: number;
  status: ReferralStatus;
  qualificationDate: string | null;
};

export type ReferralWithdrawalRow = {
  id: string;
  userId: string;
  userName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type ReferralAdminData = {
  metrics: {
    totalReferrals: number;
    pendingReferrals: number;
    qualifiedReferrals: number;
    paidReferrals: number;
    totalReferralLiability: number;
  };
  rows: ReferralAdminRow[];
  topReferrers: ReferralLeaderboardItem[];
  withdrawals: ReferralWithdrawalRow[];
};

function numberValue(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeReferralCode(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

export function normalizePhone(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) return digits.slice(3);
  return digits.replace(/^0+/, "");
}

function normalizeName(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function accountNamesMatch(profileName: string, accountName: string) {
  const profile = normalizeName(profileName);
  const resolved = normalizeName(accountName);
  if (!profile || !resolved) return false;
  if (profile === resolved) return true;

  const profileTokens = new Set(profile.split(" "));
  const resolvedTokens = new Set(resolved.split(" "));
  if (profileTokens.size < 2 || resolvedTokens.size < 2) return false;

  return [...profileTokens].every((token) => resolvedTokens.has(token));
}

function referralBaseUrl() {
  return (process.env.NEXT_PUBLIC_REFERRAL_BASE_URL || "https://homelinkbyvav.com.ng").replace(/\/$/, "");
}

export function buildReferralUrl(referralCode: string) {
  return `${referralBaseUrl()}/r/${normalizeReferralCode(referralCode)}`;
}

function formatNaira(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(numberValue(value));
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "H").concat(parts[1]?.[0] || "L").toUpperCase();
}

function referralCodeCandidate(userId: string, attempt: number) {
  const entropy = randomBytes(4).toString("hex").toUpperCase();
  const suffix = userId.replace(/-/g, "").slice(0, 3).toUpperCase();
  return `HL${suffix}${entropy}`.slice(0, attempt > 2 ? 16 : 12);
}

async function getUserPhone(userId: string) {
  const admin = createAdminClient();
  const [{ data: seeker }, { data: agent }] = await Promise.all([
    admin.from("home_seeker_profiles").select("phone").eq("user_id", userId).maybeSingle(),
    admin.from("agent_profiles").select("phone").eq("user_id", userId).maybeSingle()
  ]);
  return normalizePhone(seeker?.phone || agent?.phone || "");
}

export async function ensureReferralWallet(userId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("referral_wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as WalletRow;

  const { data, error } = await admin
    .from("referral_wallets")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (!error && data) return data as WalletRow;

  const { data: created } = await admin
    .from("referral_wallets")
    .select("*")
    .eq("user_id", userId)
    .single();
  return created as WalletRow;
}

export async function ensureReferralCode(userId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("referral_codes")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.referral_code) return existing.referral_code as string;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const referralCode = referralCodeCandidate(userId, attempt);
    const { data, error } = await admin
      .from("referral_codes")
      .insert({ user_id: userId, referral_code: referralCode })
      .select("referral_code")
      .single();

    if (!error && data?.referral_code) return data.referral_code as string;
  }

  throw new Error("Unable to generate a unique referral code.");
}

async function notifyUser(userId: string, type: string, message: string) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, type, message });
}

export async function recordReferralSignup({
  referralCode,
  referredUserId,
  referredUserType,
  email,
  phone
}: {
  referralCode?: string | null;
  referredUserId: string;
  referredUserType: AccountType;
  email: string;
  phone: string;
}) {
  const code = normalizeReferralCode(referralCode);
  if (!code) return null;

  const admin = createAdminClient();
  const { data: owner } = await admin
    .from("referral_codes")
    .select("user_id, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (!owner?.user_id || owner.user_id === referredUserId) return null;

  const { data: existingReferral } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (existingReferral) return existingReferral;

  await ensureReferralWallet(owner.user_id);

  const normalizedPhone = normalizePhone(phone);
  const referrerPhone = await getUserPhone(owner.user_id);
  const { data: referrerProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", owner.user_id)
    .maybeSingle();

  const { data: duplicatePhoneReferral } = normalizedPhone
    ? await admin
        .from("referrals")
        .select("id")
        .eq("referred_phone", normalizedPhone)
        .neq("referred_user_id", referredUserId)
        .maybeSingle()
    : { data: null };

  const sameEmail = referrerProfile?.email?.toLowerCase() === email.trim().toLowerCase();
  const samePhone = normalizedPhone && referrerPhone && normalizedPhone === referrerPhone;
  const blockedReason =
    sameEmail ? "Same email referrals are not allowed."
    : samePhone ? "Same phone number referrals are not allowed."
    : duplicatePhoneReferral ? "This phone number has already been referred."
    : null;

  const { data } = await admin
    .from("referrals")
    .insert({
      referrer_id: owner.user_id,
      referred_user_id: referredUserId,
      referred_user_type: referredUserType,
      reward_amount: referredUserType === "agent" ? AGENT_REFERRAL_REWARD : HOME_SEEKER_REFERRAL_REWARD,
      status: blockedReason ? "cancelled" : "pending",
      qualification_reason:
        blockedReason ||
        (referredUserType === "agent"
          ? "Waiting for referred agent KYC approval."
          : "Waiting for referred home seeker first paid request."),
      referred_email: email.trim().toLowerCase(),
      referred_phone: normalizedPhone || null
    })
    .select("id, status")
    .single();

  if (!blockedReason) {
    await notifyUser(owner.user_id, "referral_signup", "Someone signed up with your HomeLink referral link.");
  }

  return data;
}

export async function qualifyHomeSeekerReferral(referredUserId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("payments")
    .select("payment_id", { count: "exact", head: true })
    .eq("user_id", referredUserId)
    .eq("status", "paid")
    .not("request_id", "is", null);

  if (!count) return false;

  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id")
    .eq("referred_user_id", referredUserId)
    .eq("referred_user_type", "home_seeker")
    .eq("status", "pending")
    .maybeSingle();

  if (!referral?.id) return false;

  const { data: applied } = await admin.rpc("apply_referral_cash_reward", {
    target_referral_id: referral.id,
    target_amount: HOME_SEEKER_REFERRAL_REWARD,
    target_reason: "Home seeker submitted and paid for their first apartment request."
  });

  if (applied) {
    await notifyUser(referral.referrer_id, "referral_qualified", "Your home seeker referral qualified. ₦200 has been added to your referral wallet.");
  }

  return Boolean(applied);
}

export async function qualifyAgentReferral(referredUserId: string) {
  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agent_profiles")
    .select("kyc_status")
    .eq("user_id", referredUserId)
    .maybeSingle();

  if (agent?.kyc_status !== "approved") return false;

  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id")
    .eq("referred_user_id", referredUserId)
    .eq("referred_user_type", "agent")
    .eq("status", "pending")
    .maybeSingle();

  if (!referral?.id) return false;

  const { data: applied } = await admin.rpc("apply_referral_cash_reward", {
    target_referral_id: referral.id,
    target_amount: AGENT_REFERRAL_REWARD,
    target_reason: "Referred agent completed KYC and was approved."
  });

  if (applied) {
    await notifyUser(referral.referrer_id, "referral_qualified", "Your agent referral qualified. ₦500 has been added to your referral wallet.");
  }

  return Boolean(applied);
}

export async function grantAgentPremiumReferralBonus(referredAgentUserId: string) {
  const admin = createAdminClient();
  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id, referred_user_type")
    .eq("referred_user_id", referredAgentUserId)
    .eq("referred_user_type", "agent")
    .in("status", ["qualified", "paid"])
    .maybeSingle();

  if (!referral?.id) return false;

  const { data: existing } = await admin
    .from("credit_rewards")
    .select("id")
    .eq("source", "referred_agent_premium_upgrade")
    .eq("source_referral_id", referral.id)
    .maybeSingle();

  if (existing) return false;

  const { error } = await admin.from("credit_rewards").insert({
    user_id: referral.referrer_id,
    credits: AGENT_PREMIUM_BONUS_CREDITS,
    source: "referred_agent_premium_upgrade",
    source_referral_id: referral.id
  });

  if (error) return false;

  await notifyUser(referral.referrer_id, "referral_premium_bonus", "A referred agent upgraded. +5 request credits have been added to your rewards.");
  return true;
}

async function profilesById(userIds: string[]) {
  if (!userIds.length) return new Map<string, ProfileRow>();
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, account_type, full_name, email")
    .in("id", Array.from(new Set(userIds)));

  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

function buildBadges(qualifiedReferrals: number): ReferralBadge[] {
  return [
    { name: "Bronze", referrals: 5, unlocked: qualifiedReferrals >= 5 },
    { name: "Silver", referrals: 20, unlocked: qualifiedReferrals >= 20 },
    { name: "Gold", referrals: 50, unlocked: qualifiedReferrals >= 50 },
    { name: "Diamond", referrals: 100, unlocked: qualifiedReferrals >= 100 }
  ];
}

async function getLeaderboard(): Promise<ReferralLeaderboardItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_wallets")
    .select("user_id, qualified_referrals")
    .gt("qualified_referrals", 0)
    .order("qualified_referrals", { ascending: false })
    .limit(5);

  const rows = data ?? [];
  const profiles = await profilesById(rows.map((row) => row.user_id));

  return rows.map((row, index) => {
    const profile = profiles.get(row.user_id);
    const name = profile?.full_name || "HomeLink User";
    return {
      rank: index + 1,
      name,
      referrals: row.qualified_referrals || 0,
      initials: initialsFor(name)
    };
  });
}

export async function getReferralOverview(userId: string): Promise<ReferralOverview> {
  const admin = createAdminClient();
  const [referralCode, wallet] = await Promise.all([
    ensureReferralCode(userId),
    ensureReferralWallet(userId)
  ]);

  const [{ data: referralsData }, { data: creditRows }, { data: withdrawalRows }, leaderboard] = await Promise.all([
    admin
      .from("referrals")
      .select("id, referrer_id, referred_user_id, referred_user_type, reward_amount, status, qualification_reason, created_at, qualified_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("credit_rewards").select("credits").eq("user_id", userId),
    admin.from("withdrawal_requests").select("amount, status").eq("user_id", userId),
    getLeaderboard()
  ]);

  const referrals = (referralsData ?? []) as ReferralRow[];
  const profiles = await profilesById(referrals.map((item) => item.referred_user_id));
  const qualifiedReferrals = referrals.filter((item) => item.status === "qualified" || item.status === "paid").length;
  const pendingReferrals = referrals.filter((item) => item.status === "pending").length;
  const requestCreditsEarned = (creditRows ?? []).reduce((total, row) => total + Number(row.credits || 0), 0);
  const pendingWithdrawals = (withdrawalRows ?? [])
    .filter((row) => row.status === "pending")
    .reduce((total, row) => total + numberValue(row.amount), 0);

  return {
    referralCode,
    referralUrl: buildReferralUrl(referralCode),
    totalReferrals: referrals.length,
    qualifiedReferrals,
    pendingReferrals,
    totalEarned: numberValue(wallet.total_earned),
    availableBalance: numberValue(wallet.available_balance),
    totalPaid: numberValue(wallet.total_paid),
    requestCreditsEarned,
    withdrawalProgressPercent: Math.min(100, Math.round((numberValue(wallet.available_balance) / REFERRAL_MIN_WITHDRAWAL_NAIRA) * 100)),
    qualifiedProgress: Math.min(REFERRAL_QUALIFIED_TARGET, qualifiedReferrals),
    history: referrals.map((referral) => {
      const profile = profiles.get(referral.referred_user_id);
      return {
        id: referral.id,
        referredName: profile?.full_name || "HomeLink User",
        referredEmail: profile?.email || "hidden",
        userType: referral.referred_user_type === "agent" ? "Agent" : "Home Seeker",
        status: referral.status,
        reward: referral.reward_amount ? formatNaira(referral.reward_amount) : "Pending",
        date: new Date(referral.qualified_at || referral.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })
      };
    }),
    leaderboard,
    badges: buildBadges(qualifiedReferrals),
    pendingWithdrawals
  };
}

export async function getReferralAdminData(): Promise<ReferralAdminData> {
  const admin = createAdminClient();
  const [{ data: referralsData }, { data: codeRows }, { data: walletRows }, { data: withdrawalRows }, topReferrers] = await Promise.all([
    admin
      .from("referrals")
      .select("id, referrer_id, referred_user_id, referred_user_type, reward_amount, status, qualification_reason, created_at, qualified_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("referral_codes").select("user_id, referral_code"),
    admin.from("referral_wallets").select("user_id, available_balance"),
    admin
      .from("withdrawal_requests")
      .select("id, user_id, bank_name, account_number, account_name, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    getLeaderboard()
  ]);

  const referrals = (referralsData ?? []) as ReferralRow[];
  const allUserIds = [
    ...referrals.flatMap((item) => [item.referrer_id, item.referred_user_id]),
    ...(withdrawalRows ?? []).map((item) => item.user_id)
  ];
  const profiles = await profilesById(allUserIds);
  const codes = new Map((codeRows ?? []).map((item) => [item.user_id, item.referral_code as string]));
  const pendingWithdrawalLiability = (withdrawalRows ?? [])
    .filter((item) => item.status === "pending")
    .reduce((total, item) => total + numberValue(item.amount), 0);
  const walletLiability = (walletRows ?? []).reduce((total, item) => total + numberValue(item.available_balance), 0);

  return {
    metrics: {
      totalReferrals: referrals.length,
      pendingReferrals: referrals.filter((item) => item.status === "pending").length,
      qualifiedReferrals: referrals.filter((item) => item.status === "qualified").length,
      paidReferrals: referrals.filter((item) => item.status === "paid").length,
      totalReferralLiability: walletLiability + pendingWithdrawalLiability
    },
    rows: referrals.map((referral) => ({
      id: referral.id,
      referrer: profiles.get(referral.referrer_id)?.full_name || "HomeLink User",
      referredUser: profiles.get(referral.referred_user_id)?.full_name || "HomeLink User",
      referralCode: codes.get(referral.referrer_id) || "N/A",
      userType: referral.referred_user_type === "agent" ? "Agent" : "Home Seeker",
      rewardAmount: numberValue(referral.reward_amount),
      status: referral.status,
      qualificationDate: referral.qualified_at
    })),
    topReferrers,
    withdrawals: (withdrawalRows ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      userName: profiles.get(item.user_id)?.full_name || "HomeLink User",
      bankName: item.bank_name,
      accountNumber: item.account_number,
      accountName: item.account_name,
      amount: numberValue(item.amount),
      status: item.status,
      createdAt: item.created_at
    }))
  };
}
