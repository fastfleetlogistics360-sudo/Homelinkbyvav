import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="section white legal-page">
        <p className="kicker">Legal</p>
        <h1>HOMELINK TERMS AND CONDITION</h1>
        <p>
          By using HomeLink by V-A.V, home seekers and agents agree to use the platform honestly,
          protect personal information, and communicate respectfully during apartment request matching.
        </p>
        <section className="panel">
          <h2>Agent verification</h2>
          <p>
            Agents must submit accurate profile details, operating locations, specialties, and verification
            documents. HomeLink may approve, reject, suspend, or request updates where verification is incomplete.
          </p>
        </section>
        <section className="panel">
          <h2>Requests and communication</h2>
          <p>
            Home seekers should submit genuine apartment requests. Agents should only respond with real,
            available, and relevant property information. Inspection, payment, and rental decisions remain
            between the parties involved.
          </p>
        </section>
        <section className="panel">
          <h2>Safety and reports</h2>
          <p>
            Users should report suspicious accounts, misleading listings, harassment, or unsafe conduct.
            HomeLink may review reports and limit access where needed to protect the community.
          </p>
        </section>
        <Link className="button primary" href="/dashboard/agent/kyc">
          Back to KYC
        </Link>
      </main>
      <Footer />
    </>
  );
}
