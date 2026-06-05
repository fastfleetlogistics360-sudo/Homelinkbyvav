import Link from "next/link";
import { Mail } from "lucide-react";
import { APP_NAME, TAGLINE } from "@/lib/constants";

function BrandIcon({ label }: { label: string }) {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <text
        dominantBaseline="middle"
        fill="currentColor"
        fontSize="8"
        fontWeight="800"
        textAnchor="middle"
        x="12"
        y="12.5"
      >
        {label}
      </text>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>{APP_NAME}</strong>
        <p>{TAGLINE}</p>
        <div className="socials" aria-label="Social links">
          <Link href="https://facebook.com" aria-label="Facebook">
            <BrandIcon label="f" />
          </Link>
          <Link href="https://instagram.com" aria-label="Instagram">
            <BrandIcon label="ig" />
          </Link>
          <Link href="https://x.com" aria-label="X">
            <BrandIcon label="x" />
          </Link>
          <Link href="https://linkedin.com" aria-label="LinkedIn">
            <BrandIcon label="in" />
          </Link>
          <Link href="mailto:hello@homelink.ng" aria-label="Email">
            <Mail size={18} />
          </Link>
        </div>
      </div>
      <div className="footer-links">
        <Link href="/#about">About</Link>
        <Link href="/#how">How It Works</Link>
        <Link href="/#agents">Agent Onboarding</Link>
      </div>
      <p>© 2026 HomeLink by V-A.V. All rights reserved.</p>
    </footer>
  );
}
