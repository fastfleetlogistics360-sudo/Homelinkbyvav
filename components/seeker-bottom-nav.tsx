import Link from "next/link";
import { Gift, Home, MessageCircle, ReceiptText, UserRound, Grid2X2 } from "lucide-react";

type SeekerBottomNavItem = "dashboard" | "requests" | "messages" | "refer" | "transactions" | "profile";

const SEEKER_BOTTOM_NAV = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard/seeker", Icon: Home },
  { id: "requests", label: "Requests", href: "/dashboard/seeker/requests", Icon: Grid2X2 },
  { id: "messages", label: "Messages", href: "/dashboard/seeker/messages", Icon: MessageCircle },
  { id: "refer", label: "Refer", href: "/dashboard/referrals", Icon: Gift },
  { id: "transactions", label: "Transactions", href: "/dashboard/seeker/transactions", Icon: ReceiptText },
  { id: "profile", label: "Profile", href: "/dashboard/seeker/profile", Icon: UserRound }
] satisfies Array<{
  id: SeekerBottomNavItem;
  label: string;
  href: string;
  Icon: typeof Home;
}>;

export function SeekerBottomNav({ active }: { active: SeekerBottomNavItem }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Home seeker navigation">
      {SEEKER_BOTTOM_NAV.map(({ id, label, href, Icon }) => (
        <Link className={active === id ? "active" : ""} href={href} key={id}>
          <Icon size={28} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
