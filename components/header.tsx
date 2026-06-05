import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { getProfile } from "@/lib/auth";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";

export async function Header() {
  const profile = await getProfile();
  const publicItems: Array<[string, string]> = [
    ["About", "/#about"],
    ["How It Works", "/#how"],
    ["For Agents", "/#agents"]
  ];
  const dashboardHref = profile?.account_type === "agent" ? "/dashboard/agent" : "/dashboard/seeker";

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <Image src="/images/homelink-logo.png" alt="" width={56} height={56} priority />
        <span>
          HomeLink
          <small>by V-A.V</small>
        </span>
      </Link>

      <nav className="nav" aria-label="Main navigation">
        {!profile ? (
          <>
            {publicItems.map(([label, href]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
            <Link className="button secondary" href="/auth/login">
              Login
            </Link>
            <Link className="button navy" href="/auth/signup">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <Link href={dashboardHref}>Dashboard</Link>
            <form action={logoutAction}>
              <button className="button secondary" type="submit">
                Log out
              </button>
            </form>
          </>
        )}
      </nav>
      <MobileDrawerMenu
        dashboardHref={profile ? dashboardHref : undefined}
        items={publicItems}
        showAuthLinks={!profile}
        showLogout={Boolean(profile)}
        subtitle="Request a Home. Get Matched Fast."
        title="HomeLink"
      />
    </header>
  );
}
