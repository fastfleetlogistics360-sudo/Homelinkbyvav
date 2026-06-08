import Link from "next/link";
import { type CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  CheckCircle2,
  ClipboardList,
  Home,
  KeyRound,
  MapPin,
  MessageCircle,
  Search,
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

const processSteps: Array<{ title: string; copy: string; Icon: LucideIcon }> = [
  {
    title: "Request Home",
    copy: "Share your location, budget, apartment type, rent duration, and move-in timeline.",
    Icon: ClipboardList
  },
  {
    title: "Get Matched",
    copy: "HomeLink routes your request to approved agents who serve that area and property type.",
    Icon: Search
  },
  {
    title: "Compare Options",
    copy: "Review prices, agent badges, messages, calls, WhatsApp, and inspection details in one place.",
    Icon: MessageCircle
  },
  {
    title: "Move In",
    copy: "Choose the response that fits, inspect with confidence, and mark the request fulfilled.",
    Icon: KeyRound
  }
];

const propertyCategories = [
  {
    title: "Self Contain",
    tag: "Starter living",
    copy: "Compact private spaces for students, creators, and young professionals.",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Mini Flats",
    tag: "Budget-smart",
    copy: "Simple apartments with enough privacy and room for a cleaner daily rhythm.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Family Flats",
    tag: "2-3 bedrooms",
    copy: "Comfortable homes for families who need more space, better flow, and stable neighborhoods.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Duplexes",
    tag: "Premium homes",
    copy: "Larger, polished spaces for elevated city living and long-term comfort.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Serviced Apartments",
    tag: "Move-in ready",
    copy: "Better-finished apartments for people who want less setup stress.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  },
  {
    title: "Student Housing",
    tag: "Campus-friendly",
    copy: "Practical rooms and flats near school, transport, and everyday essentials.",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
    href: "/auth/signup?type=home_seeker"
  }
];

const trustStats = [
  { value: "KYC", label: "Agent verification before live request access" },
  { value: "1 request", label: "Structured brief routed to matching agents" },
  { value: "Paystack", label: "Payment verification before referral rewards" },
  { value: "In-app", label: "Messages, notifications, and request history" }
];

const trustItems: Array<{ title: string; copy: string; Icon: LucideIcon }> = [
  { title: "Verified agents", copy: "KYC approval gates access to live apartment requests.", Icon: BadgeCheck },
  { title: "Location-aware matching", copy: "Agents only receive requests that fit their operating locations and specialties.", Icon: MapPin },
  { title: "Clear comparison", copy: "Responses, prices, property details, messages, and agent badges stay organized.", Icon: BedDouble },
  { title: "Safer progress", copy: "Paystack verification, notifications, and dashboard history keep the journey visible.", Icon: ShieldCheck }
];

export default function HomePage() {
  return (
    <div className="public-landing">
      <Header />
      <main>
        <HeroSlider />

        <section className="section landing-section landing-trust-section" id="about">
          <div className="landing-head">
            <p className="kicker">HomeLink by V-A.V</p>
            <h2>A cleaner way to request, compare, and secure apartment options.</h2>
            <p>
              HomeLink turns scattered agent calls into one structured property request, then routes it to agents who match
              your location, budget, and home type.
            </p>
          </div>
          <div className="trust-stat-strip" aria-label="HomeLink trust indicators">
            {trustStats.map((item) => (
              <article key={item.value}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section landing-section how-section" id="how" aria-label="How HomeLink works">
          <div className="landing-head centered">
            <p className="kicker">How HomeLink Works</p>
            <h2>From request to real options in four clear steps.</h2>
            <p>No messy back-and-forth before agents understand what you want. Start with the brief, then compare responses.</p>
          </div>
          <div className="process-grid">
            {processSteps.map(({ title, copy, Icon }, index) => (
              <article className="process-card reveal-card" key={title}>
                <span className="process-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="process-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section white landing-section property-section" aria-label="Apartment categories">
          <div className="section-title-row landing-title-row">
            <div className="landing-head">
              <p className="kicker">Property lifestyles</p>
              <h2>Request the kind of home that fits your next season.</h2>
              <p>From self contain spaces to premium family homes, every request starts with the details agents need.</p>
            </div>
            <Link className="button secondary" href="/auth/signup?type=home_seeker">
              Request your match
              <ArrowRight size={18} />
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

        <section className="section landing-section trust-proof-section" aria-label="Why HomeLink is trusted">
          <div className="section-grid">
            <div className="landing-head">
              <p className="kicker">Built for trust</p>
              <h2>Less guesswork before inspection day.</h2>
              <p>
                HomeLink keeps the important context visible: who responded, what they offered, how the request moved,
                and whether the agent is approved.
              </p>
              <div className="trust-strip">
                <span>
                  <Users size={18} />
                  Verified network
                </span>
                <span>
                  <Home size={18} />
                  Request-first matching
                </span>
                <span>
                  <CheckCircle2 size={18} />
                  Trackable progress
                </span>
              </div>
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

        <section className="section white landing-section agent-onboarding" id="agents">
          <div className="section-grid agent-growth-grid">
            <div className="landing-head">
              <p className="kicker">For verified agents</p>
              <h2>Grow with requests from people who already know what they want.</h2>
              <p>
                Complete KYC, set your locations and property specialties, then receive apartment requests that fit your market.
              </p>
              <div className="row-actions">
                <Link className="button primary" href="/auth/signup?type=agent">
                  Become an Agent
                </Link>
                <Link className="button secondary" href="/auth/signup?type=home_seeker">
                  Request a Home
                </Link>
              </div>
            </div>
            <div className="agent-preview-panel reveal-card" aria-label="Agent dashboard preview">
              <div className="agent-preview-top">
                <span>
                  <Building2 size={22} />
                </span>
                <div>
                  <strong>Agent growth panel</strong>
                  <small>Request visibility, KYC status, and lead capacity.</small>
                </div>
              </div>
              <div className="agent-preview-stats">
                <article>
                  <strong>10</strong>
                  <span>Free weekly requests</span>
                </article>
                <article>
                  <strong>50</strong>
                  <span>Premium weekly requests</span>
                </article>
                <article>
                  <strong>∞</strong>
                  <span>Platinum access</span>
                </article>
              </div>
              <div className="agent-preview-list">
                <span>
                  <CheckCircle2 size={16} />
                  KYC-approved agents receive matching requests.
                </span>
                <span>
                  <Sparkles size={16} />
                  Premium and Platinum plans improve visibility.
                </span>
                <span>
                  <MessageCircle size={16} />
                  Conversations open after a property response.
                </span>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        <section className="section landing-section plans-section" id="agent-plans">
          <div className="section-title-row landing-title-row">
            <div className="landing-head">
              <p className="kicker">Agent Membership Plans</p>
              <h2>Simple plans for agents ready to grow with qualified demand.</h2>
              <p>Start free, upgrade for more weekly acceptance capacity, or go Platinum for unlimited request access.</p>
            </div>
            <Link className="button secondary" href="/auth/signup?type=agent">
              Become verified
              <ArrowRight size={18} />
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
