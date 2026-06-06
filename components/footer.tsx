import Link from "next/link";
import { InstagramLogo, WhatsAppLogo } from "@/components/social-icons";
import { APP_NAME, TAGLINE, VAV_SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>{APP_NAME}</strong>
        <p>{TAGLINE}</p>
        <div className="socials" aria-label="Social links">
          <Link href={VAV_SOCIAL_LINKS.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
            <InstagramLogo />
          </Link>
          <Link href={VAV_SOCIAL_LINKS.whatsapp} aria-label="WhatsApp" target="_blank" rel="noreferrer">
            <WhatsAppLogo />
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
