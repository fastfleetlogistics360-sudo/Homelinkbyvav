import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroSlider } from "@/components/hero-slider";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSlider />

        <section className="section white section-grid" id="about">
        <div>
          <p className="kicker">About HomeLink</p>
          <h2>Built for request-first apartment search.</h2>
        </div>
        <p>
          Home seekers describe what they need. Verified agents in the matching service area respond
          with available apartments, inspection details, and direct communication.
        </p>
        </section>

        <section className="section" id="how" aria-label="How HomeLink works">
          <div className="section-title-row">
            <div>
              <p className="kicker">How It Works</p>
              <h2>Smart request cards, fast matching.</h2>
            </div>
            <Link className="button secondary" href="/auth/signup?type=home_seeker">
              Start now
            </Link>
          </div>
          <div className="smart-card-rail">
            {[
              ["01", "Request", "Tell us location, budget, bedrooms, and move-in date.", "15% faster"],
              ["02", "Notify", "Verified matching agents get your request instantly.", "Verified"],
              ["03", "Compare", "Review responses, prices, inspection details, and chat.", "Smart match"],
              ["04", "Move", "Inspect, choose an agent, and mark your request fulfilled.", "Done"]
            ].map(([step, title, copy, tag]) => (
              <article className="smart-card" key={title}>
                <span className="promo-tag">{tag}</span>
                <strong>{step}</strong>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section white" id="agents">
        <div className="section-grid">
          <div>
            <p className="kicker">Agent onboarding</p>
            <h2>Approved agents receive qualified leads.</h2>
          </div>
          <div>
            <p>
              Agents complete KYC, submit agency details, add operating locations and property
              specialties, then receive matching home seeker requests after approval.
            </p>
            <div className="row-actions">
              <Link className="button primary" href="/auth/signup?type=agent">
                Join as Agent
              </Link>
              <Link className="button secondary" href="/auth/signup?type=home_seeker">
                Request a Home
              </Link>
            </div>
          </div>
        </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
