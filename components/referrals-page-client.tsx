"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Gift,
  Home,
  HousePlus,
  Lock,
  Medal,
  MessageCircle,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
  Zap
} from "lucide-react";
import { DashboardNotifications, type DashboardNotification } from "@/components/dashboard-notifications";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";
import { FacebookLogo, WhatsAppLogo, XLogo } from "@/components/social-icons";
import { requestWithdrawalAction } from "@/lib/actions/referrals";
import type { AccountType } from "@/lib/types";
import type { ReferralOverview } from "@/lib/referrals";

type EarnTab = "seekers" | "agents" | "premium";

const EARN_STEPS: Record<
  EarnTab,
  {
    label: string;
    reward: string;
    tone: string;
    steps: Array<{ title: string; copy: string; Icon: ComponentType<{ size?: number }> }>;
  }
> = {
  seekers: {
    label: "For Home Seekers",
    reward: "Reward: ₦200 per qualified home seeker",
    tone: "gold",
    steps: [
      { title: "Friend signs up using referral link", copy: "They create their HomeLink account from your unique link.", Icon: UserRound },
      { title: "Friend submits first apartment request", copy: "They tell HomeLink what kind of apartment they need.", Icon: HousePlus },
      { title: "Friend successfully pays via Paystack", copy: "Their first request fee is verified successfully.", Icon: WalletCards },
      { title: "Reward becomes qualified", copy: "₦200 is added to your referral wallet.", Icon: Banknote }
    ]
  },
  agents: {
    label: "For Agents",
    reward: "Reward: ₦500 per qualified agent",
    tone: "green",
    steps: [
      { title: "Agent signs up", copy: "The agent creates an account with your referral link.", Icon: UserRound },
      { title: "Agent completes KYC", copy: "They submit required agent verification details.", Icon: ShieldCheck },
      { title: "Agent account approved", copy: "Admin approves the account after review.", Icon: BadgeCheck },
      { title: "Reward becomes qualified", copy: "₦500 is added to your referral wallet.", Icon: Banknote }
    ]
  },
  premium: {
    label: "Premium Bonus",
    reward: "Reward: +5 Request Credits",
    tone: "blue",
    steps: [
      { title: "Referred Agent upgrades to Premium", copy: "They pay for a Premium or higher agent plan.", Icon: Trophy },
      { title: "Bonus automatically granted", copy: "You receive +5 request credits once per referred agent.", Icon: Zap }
    ]
  }
};

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function useAnimatedNumber(target: number, duration = 850) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;

    function tick(timestamp: number) {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
}

function StatCard({
  label,
  value,
  currency = false,
  Icon,
  tone
}: {
  label: string;
  value: number;
  currency?: boolean;
  Icon: ComponentType<{ size?: number }>;
  tone: string;
}) {
  const animated = useAnimatedNumber(value);

  return (
    <article className="referral-page-stat">
      <span className={tone}>
        <Icon size={22} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{currency ? formatNaira(animated) : animated.toLocaleString("en-NG")}</strong>
      </div>
      <Link href="#referral-history">
        View all
        <ChevronRight size={14} />
      </Link>
    </article>
  );
}

function TelegramLogo({ size = 18 }: { size?: number }) {
  return <Send aria-hidden="true" size={size} />;
}

function BottomNav({ accountType }: { accountType: AccountType }) {
  if (accountType === "agent") {
    return (
      <nav className="mobile-bottom-nav agent referral-page-bottom-nav" aria-label="Agent navigation">
        <Link href="/dashboard/agent">
          <Home size={24} />
          Dashboard
        </Link>
        <Link href="/dashboard/agent/requests">
          <ReceiptText size={24} />
          Requests
        </Link>
        <Link href="/dashboard/agent/matches">
          <ShieldCheck size={24} />
          Matches
        </Link>
        <Link className="active" href="/dashboard/referrals">
          <Gift size={24} />
          Refer
        </Link>
        <Link href="/dashboard/agent/messages">
          <MessageCircle size={24} />
          Messages
        </Link>
        <Link href="/dashboard/agent/profile">
          <UserRound size={24} />
          Profile
        </Link>
      </nav>
    );
  }

  return (
    <nav className="mobile-bottom-nav referral-page-bottom-nav" aria-label="Home seeker navigation">
      <Link href="/dashboard/seeker">
        <Home size={24} />
        Home
      </Link>
      <Link href="/dashboard/seeker#requests">
        <HousePlus size={24} />
        Requests
      </Link>
      <Link className="active" href="/dashboard/referrals">
        <Gift size={24} />
        Refer
      </Link>
      <Link href="/dashboard/seeker/messages">
        <MessageCircle size={24} />
        Messages
      </Link>
      <Link href="/dashboard/seeker#transactions">
        <ReceiptText size={24} />
        Transactions
      </Link>
      <Link href="/dashboard/seeker#profile">
        <UserRound size={24} />
        Profile
      </Link>
    </nav>
  );
}

function WithdrawalPanel({
  availableBalance,
  error,
  success
}: {
  availableBalance: number;
  error?: string;
  success?: string;
}) {
  const [open, setOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolveState, setResolveState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [resolveMessage, setResolveMessage] = useState("");
  const shortfall = Math.max(0, 2000 - availableBalance);
  const canWithdraw = availableBalance >= 2000;

  async function resolveAccount() {
    setResolveState("loading");
    setResolveMessage("");
    setAccountName("");

    const response = await fetch("/api/paystack/resolve-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank_name: bankName,
        account_number: accountNumber
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setResolveState("error");
      setResolveMessage(data.error || "Unable to resolve account.");
      return;
    }

    setAccountName(data.account_name);
    setResolveState("done");
    setResolveMessage("Account name resolved.");
  }

  return (
    <section className="referral-side-card referral-wallet-card">
      <p>Available Balance</p>
      <strong>{formatNaira(availableBalance)}</strong>
      <span>Minimum Withdrawal: ₦2,000</span>
      <div className="referral-wallet-progress">
        <span style={{ width: `${Math.min(100, (availableBalance / 2000) * 100)}%` }} />
      </div>
      {canWithdraw ? <small>You can withdraw now.</small> : <small>You need ₦{shortfall.toLocaleString("en-NG")} more to unlock withdrawals.</small>}
      {success ? <em className="referral-success-note">Withdrawal request submitted.</em> : null}
      {error ? <em className="referral-error-note">{error}</em> : null}
      <button disabled={!canWithdraw} onClick={() => setOpen(true)} type="button">
        Withdraw Earnings
        <ChevronRight size={22} />
      </button>

      {open ? (
        <div className="referral-modal-backdrop" role="presentation">
          <div className="referral-modal" role="dialog" aria-modal="true" aria-label="Withdraw referral earnings">
            <div className="referral-modal-head">
              <div>
                <p>Withdrawal Request</p>
                <h2>{formatNaira(availableBalance)}</h2>
              </div>
              <button aria-label="Close withdrawal modal" onClick={() => setOpen(false)} type="button">
                x
              </button>
            </div>
            <form action={requestWithdrawalAction}>
              <label>
                Bank Name
                <input name="bank_name" onChange={(event) => setBankName(event.target.value)} placeholder="e.g. Guaranty Trust Bank" required value={bankName} />
              </label>
              <label>
                Account Number
                <input name="account_number" inputMode="numeric" maxLength={10} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))} placeholder="10 digits" required value={accountNumber} />
              </label>
              <input name="account_name" type="hidden" value={accountName} />
              <button className="referral-resolve-button" disabled={resolveState === "loading" || !bankName || accountNumber.length !== 10} onClick={resolveAccount} type="button">
                {resolveState === "loading" ? "Resolving..." : "Resolve Account Name"}
              </button>
              {accountName ? (
                <div className="referral-resolved-name">
                  <span>Account Name</span>
                  <strong>{accountName}</strong>
                </div>
              ) : null}
              {resolveMessage ? <p className={resolveState === "error" ? "referral-error-note" : "referral-success-note"}>{resolveMessage}</p> : null}
              <button className="referral-submit-withdrawal" disabled={!accountName} type="submit">
                Submit Withdrawal
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ReferralsPageClient({
  overview,
  profileName,
  accountType,
  notifications,
  nav,
  withdrawalError,
  withdrawalSuccess
}: {
  overview: ReferralOverview;
  profileName: string;
  accountType: AccountType;
  notifications: DashboardNotification[];
  nav: Array<[string, string]>;
  withdrawalError?: string;
  withdrawalSuccess?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<EarnTab>("seekers");
  const activeConfig = EARN_STEPS[activeTab];
  const shareText = useMemo(
    () => `Join HomeLink by V-A.V with my referral link: ${overview.referralUrl}`,
    [overview.referralUrl]
  );
  const encodedUrl = encodeURIComponent(overview.referralUrl);
  const encodedText = encodeURIComponent(shareText);

  async function copyReferralLink() {
    await navigator.clipboard.writeText(overview.referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="referrals-page-ui">
      <header className="referrals-topbar">
        <MobileDrawerMenu items={nav} showLogout subtitle="Refer & Earn" title={profileName} variant="dashboard" />
        <div className="referrals-page-title">
          <h1>Refer & Earn</h1>
        </div>
        <DashboardNotifications notifications={notifications} returnTo="/dashboard/referrals" />
        <div className="referrals-profile-chip">
          <span>{profileName.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{profileName}</strong>
            <small>{accountType === "agent" ? "Verified Agent" : "Home Seeker"}</small>
          </div>
        </div>
      </header>

      <section className="referrals-hero">
        <div>
          <h2>Refer & Earn</h2>
          <p>Invite friends to HomeLink and earn rewards when they complete qualifying actions.</p>
        </div>
        <div className="reward-illustration" aria-hidden="true">
          <span className="coin one">₦</span>
          <span className="coin two">₦</span>
          <span className="wallet-shape" />
          <span className="gift-shape">
            <Gift size={42} />
          </span>
          <Sparkles className="sparkle one" size={18} />
          <Sparkles className="sparkle two" size={15} />
        </div>
      </section>

      <section className="referral-page-stats" aria-label="Referral statistics">
        <StatCard Icon={UsersRound} label="Total Referrals" tone="blue" value={overview.totalReferrals} />
        <StatCard Icon={BadgeCheck} label="Qualified Referrals" tone="green" value={overview.qualifiedReferrals} />
        <StatCard Icon={Clock3} label="Pending Referrals" tone="gold" value={overview.pendingReferrals} />
        <StatCard Icon={Banknote} currency label="Total Earned" tone="purple" value={overview.totalEarned} />
        <StatCard Icon={WalletCards} currency label="Available Balance" tone="green" value={overview.availableBalance} />
        <StatCard Icon={Zap} label="Request Credits Earned" tone="gold" value={overview.requestCreditsEarned} />
      </section>

      <div className="referrals-layout">
        <section className="referral-panel how-you-earn-panel">
          <h2>How You Earn</h2>
          <div className="earn-tabs" role="tablist" aria-label="Referral earning types">
            {(Object.keys(EARN_STEPS) as EarnTab[]).map((tab) => (
              <button aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)} role="tab" type="button">
                {EARN_STEPS[tab].label}
              </button>
            ))}
          </div>
          <div className="earn-step-list">
            {activeConfig.steps.map((step, index) => (
              <article key={step.title}>
                <span className={activeConfig.tone}>
                  <step.Icon size={22} />
                </span>
                <em>{index + 1}</em>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={`earn-reward-box ${activeConfig.tone}`}>
            <Medal size={24} />
            <strong>{activeConfig.reward}</strong>
          </div>
        </section>

        <aside className="referrals-side-stack">
          <section className="referral-side-card referral-link-card">
            <h2>Your Referral Link</h2>
            <div className="referral-page-link">
              <span>{overview.referralUrl}</span>
              <strong>{overview.referralCode}</strong>
              <button aria-label="Copy referral link" onClick={copyReferralLink} type="button">
                <Copy size={22} />
              </button>
            </div>
            {copied ? <em>Copied to clipboard.</em> : null}
            <p>Share your link</p>
            <div className="referral-share-row">
              <a className="whatsapp" href={`https://wa.me/?text=${encodedText}`} aria-label="Share on WhatsApp" target="_blank" rel="noreferrer">
                <WhatsAppLogo size={21} />
              </a>
              <a className="telegram" href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`} aria-label="Share on Telegram" target="_blank" rel="noreferrer">
                <TelegramLogo size={21} />
              </a>
              <a className="facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} aria-label="Share on Facebook" target="_blank" rel="noreferrer">
                <FacebookLogo size={21} />
              </a>
              <a className="x" href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`} aria-label="Share on X" target="_blank" rel="noreferrer">
                <XLogo size={19} />
              </a>
            </div>
          </section>

          <WithdrawalPanel availableBalance={overview.availableBalance} error={withdrawalError} success={withdrawalSuccess} />

          <section className="referral-side-card referral-credit-card">
            <Zap size={26} />
            <div>
              <p>Request Credits Earned</p>
              <strong>{overview.requestCreditsEarned}</strong>
              <small>From referred agent upgrades</small>
            </div>
          </section>

          <section className="referral-side-card referral-page-badges">
            <div className="referral-side-heading">
              <h2>Your Referral Badges</h2>
              <Link href="#leaderboard">View all</Link>
            </div>
            <div>
              {overview.badges.map((badge) => (
                <article className={badge.unlocked ? "unlocked" : ""} key={badge.name}>
                  {badge.unlocked ? <Medal size={30} /> : <Lock size={26} />}
                  <strong>{badge.name}</strong>
                  <small>{badge.referrals} referrals</small>
                </article>
              ))}
            </div>
          </section>

          <section className="referral-side-card referral-leaderboard" id="leaderboard">
            <div className="referral-side-heading">
              <h2>Top Referrers This Month</h2>
            </div>
            {overview.leaderboard.length ? (
              overview.leaderboard.map((item) => (
                <article key={`${item.rank}-${item.name}`}>
                  <span>{item.rank}</span>
                  <em>{item.initials}</em>
                  <strong>{item.name}</strong>
                  <small>{item.referrals} referrals</small>
                  {item.rank <= 3 ? <Trophy size={20} /> : null}
                </article>
              ))
            ) : (
              <p className="referral-empty-copy">No qualified referrals yet.</p>
            )}
          </section>
        </aside>
      </div>

      <section className="referral-panel referral-history-panel" id="referral-history">
        <div className="referral-history-head">
          <h2>Referral History</h2>
          <Link href="/dashboard/referrals">
            View all referrals
            <ChevronRight size={16} />
          </Link>
        </div>
        {overview.history.length ? (
          <div className="referral-history-table">
            <div className="referral-history-row heading">
              <span>Referred User</span>
              <span>User Type</span>
              <span>Status</span>
              <span>Reward</span>
              <span>Date</span>
            </div>
            {overview.history.map((item) => (
              <div className="referral-history-row" key={item.id}>
                <span>
                  <strong>{item.referredName}</strong>
                  <small>{item.referredEmail}</small>
                </span>
                <em>{item.userType}</em>
                <em className={`referral-status ${item.status}`}>{item.status}</em>
                <strong>{item.reward}</strong>
                <small>{item.date}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="referral-empty-copy">No referrals yet. Share your link to get started.</p>
        )}
      </section>

      <p className="referral-security-note">
        <CheckCircle2 size={16} />
        Referrals are tracked securely. Rewards are only given for genuine and qualified referrals.
      </p>

      <BottomNav accountType={accountType} />
    </main>
  );
}
