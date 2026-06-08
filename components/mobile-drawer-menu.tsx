"use client";

import {
  BadgeCheck,
  FileText,
  Gift,
  Handshake,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { deleteAccountAction, logoutAction } from "@/lib/actions/auth";

type DrawerItem = [string, string];

function iconForItem(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("overview") || normalized.includes("dashboard")) return Home;
  if (normalized.includes("create")) return Wallet;
  if (normalized.includes("kyc") || normalized.includes("verification")) return ShieldCheck;
  if (normalized.includes("request")) return FileText;
  if (normalized.includes("match")) return Handshake;
  if (normalized.includes("subscription")) return BadgeCheck;
  if (normalized.includes("refer")) return Gift;
  if (normalized.includes("transaction")) return ReceiptText;
  if (normalized.includes("message")) return MessageCircle;
  if (normalized.includes("profile") || normalized.includes("setting")) return UserRound;
  if (normalized.includes("review")) return Star;
  if (normalized.includes("help")) return HelpCircle;
  return Tag;
}

export function MobileDrawerMenu({
  title,
  subtitle,
  items,
  dashboardHref,
  showAuthLinks = false,
  showLogout = false,
  showDeleteAccount = showLogout,
  variant = "site"
}: {
  title: string;
  subtitle?: string;
  items: DrawerItem[];
  dashboardHref?: string;
  showAuthLinks?: boolean;
  showDeleteAccount?: boolean;
  showLogout?: boolean;
  variant?: "site" | "dashboard";
}) {
  const [open, setOpen] = useState(false);
  const quickItems = variant === "dashboard" ? items.slice(0, 3) : [];
  const listItems = variant === "dashboard" ? items.slice(3) : items;

  return (
    <>
      <button className="mobile-menu-button" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(true)} type="button">
        <Menu size={24} />
      </button>
      <div className={`mobile-drawer-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`mobile-drawer ${variant} ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="mobile-drawer-head">
          <div className="mobile-drawer-brand">
            <Image src="/images/homelink-logo.png" alt="" width={48} height={48} />
            <div>
              <h2>{title}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          <button aria-label="Close menu" className="mobile-menu-close" onClick={() => setOpen(false)} type="button">
            <X size={24} />
          </button>
        </div>

        {quickItems.length ? (
          <div className="mobile-quick-grid">
            {quickItems.map(([label, href]) => {
              const Icon = iconForItem(label);
              return (
                <Link href={href} key={href} onClick={() => setOpen(false)}>
                  <Icon size={24} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <nav className="mobile-drawer-list" aria-label="Mobile navigation">
          {dashboardHref ? (
            <Link href={dashboardHref} onClick={() => setOpen(false)}>
              <Settings size={19} />
              <span>Dashboard</span>
            </Link>
          ) : null}
          {listItems.map(([label, href]) => {
            const Icon = iconForItem(label);
            return (
              <Link href={href} key={href} onClick={() => setOpen(false)}>
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {showAuthLinks ? (
          <div className="mobile-drawer-actions mobile-drawer-bottom-actions">
            <Link className="button secondary full" href="/auth/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link className="button navy full" href="/auth/signup" onClick={() => setOpen(false)}>
              Sign Up
            </Link>
          </div>
        ) : null}

        {showLogout || showDeleteAccount ? (
          <div className="mobile-drawer-account-actions mobile-drawer-bottom-actions">
            {showLogout ? (
              <form action={logoutAction}>
                <button className="button secondary full" type="submit">
                  <LogOut size={18} />
                  Sign out
                </button>
              </form>
            ) : null}
            {showDeleteAccount ? (
              <form
                action={deleteAccountAction}
                onSubmit={(event) => {
                  if (!window.confirm("Delete your HomeLink account permanently? This cannot be undone.")) {
                    event.preventDefault();
                  }
                }}
              >
                <button className="button secondary danger full" type="submit">
                  Delete account
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  );
}
