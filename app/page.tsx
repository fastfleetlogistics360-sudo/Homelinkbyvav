import Link from "next/link";
import { HeroSlider } from "@/components/hero-slider";

export default function HomePage() {
  return (
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

      <section className="section cards" id="how" aria-label="How HomeLink works">
        {[
          ["01", "Submit your housing request", "Choose location, apartment type, bedrooms, budget, duration, and move-in date."],
          ["02", "Verified agents get notified", "Only approved agents with matching locations and specialties can see it."],
          ["03", "Get matched fast", "Agents respond with property details, price, images, and inspection availability."],
          ["04", "Inspect and move in", "Chat, call, WhatsApp, compare responses, and mark your request fulfilled."]
        ].map(([step, title, copy]) => (
          <article className="card" key={title}>
            <p className="kicker">{step}</p>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
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
  );
}
