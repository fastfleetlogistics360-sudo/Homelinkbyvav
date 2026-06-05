import Link from "next/link";

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
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
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
