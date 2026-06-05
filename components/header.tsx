import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { getProfile } from "@/lib/auth";

export async function Header() {
  const profile = await getProfile();

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
            <Link href="/#about">About</Link>
            <Link href="/#how">How It Works</Link>
            <Link href="/#agents">For Agents</Link>
            <Link className="button secondary" href="/auth/login">
              Login
            </Link>
            <Link className="button navy" href="/auth/signup">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <Link href={profile.account_type === "agent" ? "/dashboard/agent" : "/dashboard/seeker"}>
              Dashboard
            </Link>
            <form action={logoutAction}>
              <button className="button secondary" type="submit">
                Log out
              </button>
            </form>
          </>
        )}
      </nav>
    </header>
  );
}
