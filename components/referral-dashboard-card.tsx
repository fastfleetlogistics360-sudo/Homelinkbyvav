"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Gift,
  Send,
  Sparkles,
  UsersRound,
  WalletCards
} from "lucide-react";
import { FacebookLogo, WhatsAppLogo, XLogo } from "@/components/social-icons";
import type { ReferralOverview } from "@/lib/referrals";

const INFO_SLIDES = [
  "Invite a Home Seeker -> First Request Paid -> Earn ₦200",
  "Invite an Agent -> KYC Approved -> Earn ₦500",
  "Referred Agent Upgrades To Premium -> Get +5 Request Credits",
  "Withdraw Once Balance Reaches ₦2,000",
  "Monthly Top Referrer Rewards"
];

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

function AnimatedMetric({
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
    <article className="referral-mini-stat">
      <div>
        <span className={tone}>
          <Icon size={21} />
        </span>
        <p>{label}</p>
      </div>
      <strong>{currency ? formatNaira(animated) : animated.toLocaleString("en-NG")}</strong>
    </article>
  );
}

function TelegramLogo({ size = 18 }: { size?: number }) {
  return <Send aria-hidden="true" size={size} />;
}

export function ReferralDashboardCard({ overview }: { overview: ReferralOverview }) {
  const [copied, setCopied] = useState(false);
  const [slide, setSlide] = useState(0);
  const progressPercent = Math.min(100, (overview.qualifiedProgress / 10) * 100);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % INFO_SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

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
    <section className="referral-widget reveal-card" aria-labelledby="referral-widget-title">
      <div className="referral-widget-head">
        <div className="referral-title-lockup">
          <span>
            <Gift size={30} />
          </span>
          <div>
            <h2 id="referral-widget-title">Refer & Earn</h2>
            <p>Invite others and earn money when they complete qualifying actions.</p>
          </div>
        </div>
        <Link className="referral-how-link" href="/dashboard/referrals">
          <CircleHelp size={18} />
          How it works
        </Link>
      </div>

      <div className="referral-widget-grid">
        <div className="referral-widget-main">
          <div className="referral-stat-strip">
            <AnimatedMetric Icon={UsersRound} label="Total Referrals" tone="blue" value={overview.totalReferrals} />
            <AnimatedMetric Icon={BadgeCheck} label="Qualified Referrals" tone="green" value={overview.qualifiedReferrals} />
            <AnimatedMetric Icon={Clock3} label="Pending Referrals" tone="gold" value={overview.pendingReferrals} />
            <AnimatedMetric Icon={WalletCards} currency label="Available Balance" tone="purple" value={overview.availableBalance} />
            <AnimatedMetric Icon={Sparkles} label="Request Credits Earned" tone="green" value={overview.requestCreditsEarned} />
          </div>

          <div className="referral-progress-block">
            <div>
              <p>Withdrawals unlock at ₦2,000</p>
              <strong>{overview.qualifiedProgress} / 10</strong>
            </div>
            <span className="referral-progress-track">
              <span style={{ width: `${progressPercent}%` }} />
            </span>
            <small>Current Qualified Referrals / 10</small>
          </div>

          <div className="referral-link-panel">
            <label>Your Referral Link</label>
            <div>
              <span>{overview.referralUrl}</span>
              <button aria-label="Copy referral link" onClick={copyReferralLink} type="button">
                <Copy size={18} />
              </button>
            </div>
            {copied ? <em>Copied</em> : null}
          </div>
        </div>

        <aside className="referral-widget-side">
          <div className="referral-carousel" aria-live="polite">
            <Sparkles size={18} />
            <p>{INFO_SLIDES[slide]}</p>
          </div>

          <div className="referral-share-stack">
            <span>Share via:</span>
            <div>
              <a className="whatsapp" href={`https://wa.me/?text=${encodedText}`} aria-label="Share on WhatsApp" target="_blank" rel="noreferrer">
                <WhatsAppLogo size={20} />
              </a>
              <a className="telegram" href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`} aria-label="Share on Telegram" target="_blank" rel="noreferrer">
                <TelegramLogo size={20} />
              </a>
              <a className="facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} aria-label="Share on Facebook" target="_blank" rel="noreferrer">
                <FacebookLogo size={20} />
              </a>
              <a className="x" href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`} aria-label="Share on X" target="_blank" rel="noreferrer">
                <XLogo size={18} />
              </a>
            </div>
          </div>

          <div className="referral-badge-row">
            {overview.badges.map((badge) => (
              <span className={badge.unlocked ? "unlocked" : ""} key={badge.name}>
                {badge.name}
                <small>{badge.referrals} referrals</small>
              </span>
            ))}
          </div>

          <Link className="referral-earnings-link" href="/dashboard/referrals">
            View Earnings
            <ChevronRight size={22} />
          </Link>
        </aside>
      </div>
    </section>
  );
}
