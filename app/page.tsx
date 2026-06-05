import Link from "next/link";
import { type CSSProperties } from "react";
import {
  BadgeCheck,
  Building2,
  Clock3,
  Home,
  KeyRound,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon
} from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroSlider } from "@/components/hero-slider";
import { TestimonialsSection } from "@/components/testimonials-section";
import { getPlanBadge } from "@/lib/agent-plans";
import { AGENT_PLANS, type AgentPlanId } from "@/lib/constants";

const propertyCategories = [
  {
    title: "Smart starter spaces",
    tag: "Self contain | Mini flats",
    copy: "Compact homes for students, young professionals, and anyone who wants privacy without wasted rent.",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Family-ready apartments",
    tag: "2-3 bedroom flats",
    copy: "Find more room to breathe, settle, host, and grow in neighbourhoods that match your daily rhythm.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Premium city living",
    tag: "Duplexes | Serviced homes",
    copy: "Tell verified agents the lifestyle you want, then compare refined options without chasing random contacts.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  }
];

const trustItems: Array<{ title: string; copy: string; Icon: LucideIcon }> = [
  { title: "Verified listings", copy: "Requests are routed to approved agents who understand your location and apartment type.", Icon: BadgeCheck },
  { title: "Trusted agents", copy: "Agent KYC, ratings, and plan badges help you know who is responding before you commit.", Icon: ShieldCheck },
  { title: "Faster discovery", copy: "One clear request can reach matching agents in your state, saving calls and transport stress.", Icon: Clock3 },
  { title: "Secure communication", copy: "Chat, compare responses, call, WhatsApp, and keep request history in your dashboard.", Icon: MessageCircle },
  { title: "Local expertise", copy: "Agents see requests only inside their operating areas, so local market knowledge stays close.", Icon: MapPin }
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSlider />

        <section className="section landing-section intro-section" id="about">
          <div className="landing-head">
            <p className="kicker">HomeLink by V-A.V</p>
            <h2>Apartment hunting should feel hopeful again.</h2>
            <p>
              Share the home you have in mind and let verified agents bring relevant options to you,
              from budget-friendly rooms to polished family apartments.
            </p>
          </div>
          <div className="trust-strip" aria-label="HomeLink platform highlights">
            <span>
              <Users size={18} />
              Verified agents
            </span>
            <span>
              <Home size={18} />
              Request-first matching
            </span>
            <span>
              <KeyRound size={18} />
              Move-in focused
            </span>
          </div>
        </section>

        <section className="section white landing-section property-section" aria-label="Apartment categories">
          <div className="section-title-row landing-title-row">
            <div className="landing-head">
              <p className="kicker">Explore by lifestyle</p>
              <h2>Homes that match how you want to live.</h2>
              <p>Choose the kind of space you need, then let HomeLink route your request to agents who can actually help.</p>
            </div>
            <Link className="button secondary" href="/auth/signup?type=home_seeker">
              Request your match
            </Link>
          </div>
          <div className="property-card-grid">
            {propertyCategories.map((category) => (
              <Link className="property-card reveal-card" href={category.href} key={category.title}>
                <span className="property-card-media" style={{ backgroundImage: `url('${category.image}')` } as CSSProperties} />
                <span className="property-card-body">
                  <span className="property-tag">{category.tag}</span>
                  <strong>{category.title}</strong>
                  <span>{category.copy}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section landing-section" id="how" aria-label="How HomeLink works">
          <div className="landing-head centered">
            <p className="kicker">How It Works</p>
            <h2>From one request to real apartment options.</h2>
            <p>HomeLink keeps the process simple, visible, and built around the home you are actually trying to find.</p>
          </div>
          <div className="smart-card-rail premium-steps">
            {[
              ["01", "Describe your ideal home", "Location, budget, bedrooms, rent duration, move-in date, and the little details that matter.", "Start"],
              ["02", "Verified agents get notified", "Only approved agents in matching locations and specialties can respond to your request.", "Matched"],
              ["03", "Compare with confidence", "Review responses, prices, inspection details, agent badges, calls, WhatsApp, and chat.", "Compare"],
              ["04", "Inspect and move forward", "Choose the response that feels right, inspect the apartment, and mark your request fulfilled.", "Move"]
            ].map(([step, title, copy, tag]) => (
              <article className="smart-card reveal-card" key={title}>
                <span className="promo-tag">{tag}</span>
                <strong>{step}</strong>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section white landing-section why-section" aria-label="Why HomeLink">
          <div className="section-grid">
            <div className="landing-head">
              <p className="kicker">Why HomeLink</p>
              <h2>Built for trust before inspection day.</h2>
              <p>
                Every feature is shaped around a simple promise: help home seekers find clearer options
                and help serious agents build a reputation that lasts.
              </p>
            </div>
            <div className="why-card-grid">
              {trustItems.map(({ title, copy, Icon }) => (
                <article className="why-card reveal-card" key={title}>
                  <span>
                    <Icon size={22} />
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <TestimonialsSection />

        <section className="section white landing-section agent-onboarding" id="agents">
          <div className="section-grid">
            <div className="landing-head">
              <p className="kicker">For verified agents</p>
              <h2>Meet home seekers who already know what they want.</h2>
            </div>
            <div className="glass-panel">
              <Building2 size={28} />
              <p>
                Complete KYC, add your service areas and property specialties, then receive qualified
                apartment requests from people searching in your market.
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

        <section className="section landing-section plans-section" id="agent-plans">
          <div className="section-title-row landing-title-row">
            <div className="landing-head">
              <p className="kicker">Agent Membership Plans</p>
              <h2>Grow visibility where serious renters are already asking.</h2>
              <p>Start free, upgrade when you need more lead capacity, or go Platinum for priority exposure.</p>
            </div>
            <Link className="button secondary" href="/auth/signup?type=agent">
              Become verified
            </Link>
          </div>
          <div className="pricing-grid public-pricing">
            {(Object.keys(AGENT_PLANS) as AgentPlanId[]).map((planId) => {
              const plan = AGENT_PLANS[planId];
              const badge = getPlanBadge(plan.id);
              return (
                <article className={`pricing-card ${plan.id} ${plan.id === "premium" ? "spotlight" : ""}`} key={plan.id}>
                  {plan.highlight ? <span className="promo-tag">{plan.highlight}</span> : null}
                  <span className={`badge plan-badge ${plan.id}`}>{badge || "Free Agent"}</span>
                  <h3>{plan.name}</h3>
                  <p className="price">
                    ₦{plan.price.toLocaleString()}
                    <span>/{plan.interval}</span>
                  </p>
                  <ul>
                    {plan.features.slice(0, 6).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link
                    className={`button ${plan.id === "free" ? "secondary" : plan.id === "platinum" ? "navy" : "primary"} full`}
                    href={plan.id === "free" ? "/auth/signup?type=agent" : `/auth/signup?type=agent&plan=${plan.id}`}
                  >
                    {plan.id === "free" ? "Start Free" : plan.id === "premium" ? "Upgrade to Premium" : "Go Platinum"}
                  </Link>
                </article>
              );
            })}
          </div>
          <div className="plans-footnote">
            <Sparkles size={18} />
            <span>Premium is highlighted for agents who want faster growth without jumping straight to unlimited access.</span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
