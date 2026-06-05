import Link from "next/link";
import { Mail } from "lucide-react";
import { FacebookLogo, InstagramLogo, LinkedinLogo, WhatsAppLogo, XLogo } from "@/components/social-icons";
import { APP_NAME, TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>{APP_NAME}</strong>
        <p>{TAGLINE}</p>
        <div className="socials" aria-label="Social links">
          <Link href="https://facebook.com" aria-label="Facebook">
            <FacebookLogo />
          </Link>
          <Link href="https://instagram.com" aria-label="Instagram">
            <InstagramLogo />
          </Link>
          <Link href="https://x.com" aria-label="X">
            <XLogo />
          </Link>
          <Link href="https://linkedin.com" aria-label="LinkedIn">
            <LinkedinLogo />
          </Link>
          <Link href="https://wa.me/" aria-label="WhatsApp">
            <WhatsAppLogo />
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
