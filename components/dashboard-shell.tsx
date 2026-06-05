import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { MobileDrawerMenu } from "@/components/mobile-drawer-menu";

export function DashboardShell({
  title,
  kicker,
  nav,
  children
}: {
  title: string;
  kicker: string;
  nav: Array<[string, string]>;
  children: React.ReactNode;
}) {
  return (
    <main className="dashboard">
      <header className="dashboard-topbar">
        <Link className="brand" href="/">
          <Image src="/images/homelink-logo.png" alt="" width={48} height={48} />
          <span>
            HomeLink
            <small>by V-A.V</small>
          </span>
        </Link>
        <div className="dashboard-title">
          <p className="kicker">{kicker}</p>
          <h1>{title}</h1>
        </div>
        <form action={logoutAction}>
          <button className="button secondary" type="submit">
            Log out
          </button>
        </form>
        <MobileDrawerMenu items={nav} showLogout subtitle={kicker} title={title} variant="dashboard" />
      </header>
      <div className="dashboard-grid">
        <aside className="panel sidebar">
          {nav.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
