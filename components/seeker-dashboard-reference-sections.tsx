"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Bell,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards
} from "lucide-react";
import { logoutAction, sendPasswordResetAction } from "@/lib/actions/auth";
import { markRequestFulfilledAction } from "@/lib/actions/requests";
import { VAV_SOCIAL_LINKS } from "@/lib/constants";
import { isSuccessfulPayment, paymentStatusLabel } from "@/lib/payment-status";

type RequestResponse = {
  response_id: string;
  message: string;
  property_title: string;
  property_location: string;
  property_price: string;
  property_images?: string[] | null;
  status: string;
  created_at: string;
  agent_profiles?: {
    agency_name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    agent_plan?: string | null;
    rating?: number | null;
  } | null;
};

type HousingRequestItem = {
  request_id: string;
  preferred_location: string;
  area?: string | null;
  property_type: string;
  bedrooms: string;
  budget_min: number | string;
  budget_max: number | string;
  rent_duration: string;
  move_in_date: string;
  extra_notes?: string | null;
  status: string;
  created_at: string;
  request_responses?: RequestResponse[] | null;
};

type PaymentItem = {
  payment_id: string;
  request_id?: string | null;
  reference: string;
  amount: number | string;
  status: string;
  provider_payload?: unknown;
  created_at: string;
};

type SeekerReferenceSectionsProps = {
  email: string;
  fullName: string;
  phone?: string | null;
  preferredLocations: string[];
  requests: HousingRequestItem[];
  payments: PaymentItem[];
  responseCount: number;
  sections?: Array<"requests" | "transactions" | "profile">;
  savedCount: number;
};

type TransactionFilter = "all" | "payments" | "receipts" | "pending";

function formatNaira(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(value || 0));
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    hour12: true,
    minute: "2-digit"
  });
}

function formatTimeAgo(value: string) {
  const created = new Date(value).getTime();
  const diff = Number.isFinite(created) ? Math.max(Date.now() - created, 0) : 0;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function transactionLabel(payment: PaymentItem) {
  if (payment.reference?.startsWith("HL-SUB")) return "Agent subscription";
  if (payment.request_id) return "Agent connection fee";
  return isSuccessfulPayment(payment) ? "Welcome bonus" : "HomeLink payment";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function locationText(request: HousingRequestItem) {
  return request.area || request.preferred_location || "Preferred area";
}

function bedroomsText(value: string) {
  if (!value) return "Any";
  if (value.toLowerCase().includes("studio")) return "Studio";
  return value.match(/\d+/)?.[0] || value;
}

function buildRequestTitle(request: HousingRequestItem) {
  return `${request.bedrooms || ""} ${request.property_type} in ${locationText(request)}`.replace(/\s+/g, " ").trim();
}

function responseBadge(response: RequestResponse, index: number) {
  if (index === 0) return "Best Match";
  if (response.agent_profiles?.agent_plan && response.agent_profiles.agent_plan !== "free") return "Verified Agent";
  return "Free Agent";
}

export function SeekerDashboardReferenceSections({
  email,
  fullName,
  phone,
  preferredLocations,
  requests,
  payments,
  responseCount,
  sections = ["requests", "transactions", "profile"],
  savedCount
}: SeekerReferenceSectionsProps) {
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");
  const latestRequest = requests[0] || null;
  const requestResponses = latestRequest?.request_responses ?? [];
  const visibleTransactions = useMemo(() => {
    return payments.filter((payment) => {
      if (transactionFilter === "all") return true;
      if (transactionFilter === "pending") return !isSuccessfulPayment(payment);
      if (transactionFilter === "receipts") return isSuccessfulPayment(payment);
      return Boolean(payment.amount);
    });
  }, [payments, transactionFilter]);
  const successfulPayments = payments.filter(isSuccessfulPayment);
  const pendingPayments = payments.filter((payment) => !isSuccessfulPayment(payment));
  const totalPaid = successfulPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const totalPending = pendingPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const totalReceipts = successfulPayments.length;
  const progressSteps = [
    { label: "Submitted", complete: Boolean(latestRequest), date: latestRequest ? formatShortDate(latestRequest.created_at) : "Pending" },
    { label: "Matched", complete: latestRequest ? ["matched", "accepted", "fulfilled"].includes(latestRequest.status) : false, date: latestRequest ? formatShortDate(latestRequest.created_at) : "Pending" },
    { label: "Agent Responded", complete: requestResponses.length > 0, date: requestResponses[0] ? formatShortDate(requestResponses[0].created_at) : "Pending" },
    { label: "Apartment Viewed", complete: false, date: "Pending" },
    { label: "Completed", complete: latestRequest?.status === "fulfilled", date: latestRequest?.status === "fulfilled" ? "Done" : "Pending" }
  ];
  const location = preferredLocations[0] || latestRequest?.preferred_location || "Location not set";
  const showRequests = sections.includes("requests");
  const showTransactions = sections.includes("transactions");
  const showProfile = sections.includes("profile");

  return (
    <>
      {showRequests ? (
      <section className="seeker-reference-section seeker-reference-requests" id="requests">
        <div className="seeker-reference-head">
          <div>
            <h2>My Requests</h2>
            <p>Track apartment matches and agent responses.</p>
          </div>
          <Link className="seeker-reference-primary" href="/dashboard/seeker/requests/new">
            <Plus size={22} />
            New Request
          </Link>
        </div>

        {latestRequest ? (
          <>
            <article className="seeker-request-reference-card">
              <div className="seeker-request-card-top">
                <span className={`seeker-status-pill ${latestRequest.status}`}>{latestRequest.status}</span>
                <div>
                  <Clock3 size={19} />
                  {formatTimeAgo(latestRequest.created_at)}
                  <MoreHorizontal size={23} />
                </div>
              </div>
              <div className="seeker-request-card-main">
                <img alt="" src="/images/seeker-hero-house.png" />
                <div>
                  <h3>{buildRequestTitle(latestRequest)}</h3>
                  <strong>
                    {formatNaira(latestRequest.budget_min)} - {formatNaira(latestRequest.budget_max)}
                  </strong>
                  <div className="seeker-request-facts">
                    <span>
                      <BedDouble size={23} />
                      <strong>{bedroomsText(latestRequest.bedrooms)}</strong>
                      <small>Bedrooms</small>
                    </span>
                    <span>
                      <Bath size={23} />
                      <strong>Any</strong>
                      <small>Bathrooms</small>
                    </span>
                    <span>
                      <MapPin size={23} />
                      <strong>{locationText(latestRequest)}</strong>
                      <small>Location</small>
                    </span>
                    <span>
                      <CalendarDays size={23} />
                      <strong>{formatShortDate(latestRequest.move_in_date).replace(/,.*$/, "")}</strong>
                      <small>Move-in</small>
                    </span>
                  </div>
                </div>
              </div>
              <p>{latestRequest.extra_notes || `Looking for a ${latestRequest.property_type.toLowerCase()} within budget.`}</p>
              <ChevronRight className="seeker-card-chevron" size={26} />
            </article>

            <div className="seeker-responses-title">
              <h3>Agent Responses ({requestResponses.length})</h3>
              <Link href="/dashboard/seeker/messages">
                View all
                <ChevronRight size={22} />
              </Link>
            </div>

            <div className="seeker-agent-response-list">
              {requestResponses.length ? (
                requestResponses.slice(0, 3).map((response, index) => {
                  const agentName = response.agent_profiles?.agency_name || "HomeLink Agent";
                  const phoneHref = response.agent_profiles?.phone ? `tel:${response.agent_profiles.phone}` : undefined;
                  const whatsappHref = response.agent_profiles?.whatsapp ? `https://wa.me/${response.agent_profiles.whatsapp}` : undefined;
                  return (
                    <article className={index === 0 ? "best" : ""} key={response.response_id}>
                      <span className="seeker-agent-avatar">{initials(agentName)}</span>
                      <i aria-hidden="true" />
                      <div className="seeker-agent-copy">
                        <div>
                          <h4>{agentName}</h4>
                          <em>{responseBadge(response, index)}</em>
                        </div>
                        <p>{response.message || response.property_title}</p>
                        <strong>{response.property_price || formatNaira(latestRequest.budget_min)}</strong>
                        <div className="seeker-agent-actions">
                          <a className={!phoneHref ? "disabled" : ""} href={phoneHref || "/dashboard/seeker/requests"}>
                            <Phone size={20} />
                            Call
                          </a>
                          <a className={!whatsappHref ? "disabled" : ""} href={whatsappHref || "/dashboard/seeker/requests"} rel="noreferrer" target={whatsappHref ? "_blank" : undefined}>
                            <MessageCircle size={20} />
                            WhatsApp
                          </a>
                          <Link href="/dashboard/seeker/messages">
                            <MessageCircle size={21} />
                            Message
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="seeker-empty-reference-card">
                  <h4>No agent responses yet.</h4>
                  <p>Verified agents will appear here once they respond to your request.</p>
                </article>
              )}
            </div>

            <article className="seeker-progress-card">
              <h3>Request Progress</h3>
              <div>
                {progressSteps.map((step) => (
                  <span className={step.complete ? "complete" : ""} key={step.label}>
                    <i>{step.complete ? <Check size={18} /> : null}</i>
                    <strong>{step.label}</strong>
                    <small>{step.date}</small>
                  </span>
                ))}
              </div>
            </article>

            <div className="seeker-request-footer-actions">
              {latestRequest.status !== "fulfilled" ? (
                <form action={markRequestFulfilledAction}>
                  <input name="request_id" type="hidden" value={latestRequest.request_id} />
                  <button type="submit">
                    <CheckCircle2 size={22} />
                    Mark Fulfilled
                  </button>
                </form>
              ) : (
                <button disabled type="button">
                  <CheckCircle2 size={22} />
                  Completed
                </button>
              )}
              <Link href="/dashboard/seeker/requests/new">
                <Search size={23} />
                Still Searching
              </Link>
            </div>
          </>
        ) : (
          <article className="seeker-empty-reference-card">
            <h3>No requests yet.</h3>
            <p>Create your first apartment request and verified agents can respond with matching options.</p>
            <Link href="/dashboard/seeker/requests/new">
              <Plus size={20} />
              New Request
            </Link>
          </article>
        )}
      </section>
      ) : null}

      {showTransactions ? (
      <section className="seeker-reference-section seeker-reference-transactions" id="transactions">
        <div className="seeker-reference-head">
          <div>
            <h2>Transaction History</h2>
            <p>View your payments and receipts.</p>
          </div>
          <Link className="seeker-reference-primary" href="/dashboard/seeker/transactions">
            <FileText size={22} />
            View all
          </Link>
        </div>

        <div className="seeker-transaction-tabs" role="tablist" aria-label="Transaction filters">
          {[
            ["all", "All"],
            ["payments", "Payments"],
            ["receipts", "Receipts"],
            ["pending", "Pending"]
          ].map(([value, label]) => (
            <button
              aria-selected={transactionFilter === value}
              className={transactionFilter === value ? "active" : ""}
              key={value}
              onClick={() => setTransactionFilter(value as TransactionFilter)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="seeker-transaction-summary-card">
          <article>
            <span className="purple">
              <FileText size={24} />
            </span>
            <p>Total Transactions</p>
            <strong>{payments.length}</strong>
            <small>This year</small>
          </article>
          <article>
            <span className="green">
              <WalletCards size={24} />
            </span>
            <p>Total Paid</p>
            <strong>{formatNaira(totalPaid)}</strong>
            <small>This year</small>
          </article>
          <article>
            <span className="blue">
              <ReceiptText size={24} />
            </span>
            <p>Total Receipts</p>
            <strong>{totalReceipts}</strong>
            <small>This year</small>
          </article>
          <article>
            <span className="gold">
              <Clock3 size={24} />
            </span>
            <p>Pending</p>
            <strong>{formatNaira(totalPending)}</strong>
            <small>{pendingPayments.length} transactions</small>
          </article>
        </div>

        <div className="seeker-recent-transactions-head">
          <h3>Recent Transactions</h3>
          <button type="button">
            Sort: Newest
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="seeker-transaction-reference-list">
          {visibleTransactions.length ? (
            visibleTransactions.map((payment) => {
              const date = new Date(payment.created_at);
              const day = Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString("en-NG", { day: "2-digit" });
              const month = Number.isNaN(date.getTime()) ? "---" : date.toLocaleDateString("en-NG", { month: "short" }).toUpperCase();
              const year = Number.isNaN(date.getTime()) ? "----" : date.getFullYear();
              const completed = isSuccessfulPayment(payment);
              return (
                <article key={payment.payment_id}>
                  <time className={completed ? "completed" : ""}>
                    <span>{month}</span>
                    <strong>{day}</strong>
                    <small>{year}</small>
                  </time>
                  <div>
                    <h4>{transactionLabel(payment)}</h4>
                    <p>{payment.reference}</p>
                    <strong className={completed ? "paid" : ""}>{formatNaira(payment.amount)}</strong>
                    <small>
                      {formatShortDate(payment.created_at)} • {formatTime(payment.created_at)}
                    </small>
                  </div>
                  <em className={completed ? "completed" : "pending"}>{paymentStatusLabel(payment)}</em>
                  <ChevronRight size={26} />
                </article>
              );
            })
          ) : (
            <article className="seeker-empty-reference-card">
              <h4>No transactions in this filter.</h4>
              <p>Your HomeLink payments and receipts will appear here.</p>
            </article>
          )}
        </div>
      </section>
      ) : null}

      {showProfile ? (
      <section className="seeker-reference-section seeker-reference-profile" id="profile">
        <div className="seeker-reference-head">
          <div>
            <h2>Profile</h2>
            <p>Manage your account and preferences.</p>
          </div>
          <Link className="seeker-reference-primary" href="/dashboard/seeker/requests/new">
            <Plus size={22} />
            New request
          </Link>
        </div>

        <article className="seeker-profile-hero-reference">
          <div className="seeker-profile-photo">
            <span>{initials(fullName)}</span>
            <button aria-label="Change profile photo" type="button">
              <Camera size={19} />
            </button>
          </div>
          <div className="seeker-profile-main">
            <h3>{fullName}</h3>
            <span>
              <ShieldCheck size={18} />
              Verified
            </span>
            <p>
              <Mail size={20} />
              {email}
            </p>
            <p>
              <Phone size={20} />
              {phone || "Phone not set"}
            </p>
            <p>
              <MapPin size={20} />
              {location}
            </p>
          </div>
          <Link aria-label="Edit profile details" href="/dashboard/seeker/profile">
            <ChevronRight size={30} />
          </Link>
          <div className="seeker-profile-stat-row">
            <article>
              <span className="purple">
                <FileText size={24} />
              </span>
              <p>Requests</p>
              <strong>{requests.length}</strong>
              <small>Total requests</small>
            </article>
            <article>
              <span className="blue">
                <UserRound size={24} />
              </span>
              <p>Agent responses</p>
              <strong>{responseCount}</strong>
              <small>Total responses</small>
            </article>
            <article>
              <span className="green">
                <Bookmark size={24} />
              </span>
              <p>Saved listings</p>
              <strong>{savedCount}</strong>
              <small>Saved properties</small>
            </article>
          </div>
        </article>

        <article className="seeker-profile-menu-reference">
          <Link href="/dashboard/seeker/profile">
            <span>
              <UserRound size={24} />
            </span>
            <strong>Personal Information</strong>
            <small>Update your details</small>
            <ChevronRight size={26} />
          </Link>
          <Link href="/dashboard/seeker/messages">
            <span>
              <Bell size={24} />
            </span>
            <strong>Notifications</strong>
            <small>Manage notifications</small>
            <ChevronRight size={26} />
          </Link>
          <form action={sendPasswordResetAction}>
            <input name="return_to" type="hidden" value="/dashboard/seeker/profile" />
            <button type="submit">
              <span>
                <Lock size={24} />
              </span>
              <strong>Security</strong>
              <small>Change password</small>
              <ChevronRight size={26} />
            </button>
          </form>
          <Link href="/dashboard/seeker/transactions">
            <span>
              <CreditCard size={24} />
            </span>
            <strong>Payment Methods</strong>
            <small>Manage your payments</small>
            <ChevronRight size={26} />
          </Link>
          <a href={VAV_SOCIAL_LINKS.whatsapp} rel="noreferrer" target="_blank">
            <span>
              <HelpCircle size={24} />
            </span>
            <strong>Help & Support</strong>
            <small>Get help and contact support</small>
            <ChevronRight size={26} />
          </a>
          <form action={logoutAction}>
            <button type="submit">
              <span>
                <LogOut size={24} />
              </span>
              <strong>Logout</strong>
              <small>Sign out of your account</small>
              <ChevronRight size={26} />
            </button>
          </form>
        </article>
      </section>
      ) : null}
    </>
  );
}
