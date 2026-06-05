"use client";

import { Activity, HelpCircle, LogOut, Menu, Tag, UserRound, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

type DrawerItem = [string, string];

export function MobileDrawerMenu({
  title,
  subtitle,
  items,
  dashboardHref,
  showAuthLinks = false,
  showLogout = false,
  variant = "site"
}: {
  title: string;
  subtitle?: string;
  items: DrawerItem[];
  dashboardHref?: string;
  showAuthLinks?: boolean;
  showLogout?: boolean;
  variant?: "site" | "dashboard";
}) {
  const [open, setOpen] = useState(false);
  const quickItems = variant === "dashboard" ? items.slice(0, 3) : [];
  const listItems = variant === "dashboard" ? items.slice(3) : items;
  const quickIcons = [HelpCircle, Wallet, Activity];

  return (
    <>
      <button className="mobile-menu-button" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(true)} type="button">
        <Menu size={24} />
      </button>
      <div className={`mobile-drawer-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`mobile-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
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
            {quickItems.map(([label, href], index) => {
              const Icon = quickIcons[index] || Activity;
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
              <UserRound size={19} />
              <span>Dashboard</span>
            </Link>
          ) : null}
          {listItems.map(([label, href]) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              <Tag size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {showAuthLinks ? (
          <div className="mobile-drawer-actions">
            <Link className="button secondary full" href="/auth/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link className="button navy full" href="/auth/signup" onClick={() => setOpen(false)}>
              Sign Up
            </Link>
          </div>
        ) : null}

        {showLogout ? (
          <form className="mobile-drawer-signout" action={logoutAction}>
            <button className="button secondary full" type="submit">
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        ) : null}
      </aside>
    </>
  );
}
