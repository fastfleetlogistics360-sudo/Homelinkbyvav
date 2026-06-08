"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { ArrowRight, Building2, Home, Search, ShieldCheck } from "lucide-react";
import { type HeroSlide } from "@/lib/hero-slides";

export function HeroSliderClient({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero-slider" aria-label="HomeLink adverts">
      {slides.map((slide, index) => (
        <article
          className={`hero-slide ${active === index ? "active" : ""}`}
          key={`${slide.sort_order}-${slide.title}`}
          style={{ "--slide-image": `url('${slide.image_url}')` } as CSSProperties}
        >
          <div className="hero-slide-shell">
            <div className="hero-content">
              <p className="kicker">{slide.kicker}</p>
              <h1>{slide.title}</h1>
              <p>{slide.copy}</p>
              <div className="hero-actions">
                <Link className="button primary" href={slide.primary_url}>
                  {slide.primary_label}
                </Link>
                <Link className="button secondary" href={slide.secondary_url}>
                  {slide.secondary_label}
                </Link>
              </div>
            </div>

            <aside className="hero-request-card" aria-label="Quick HomeLink actions">
              <div className="hero-request-card-head">
                <span>
                  <Search size={20} />
                </span>
                <div>
                  <strong>Start smarter</strong>
                  <small>Choose the path that fits your search.</small>
                </div>
              </div>
              <Link href="/auth/signup?type=home_seeker">
                <span>
                  <Home size={18} />
                </span>
                <div>
                  <strong>Request a Home</strong>
                  <small>Tell agents what you need.</small>
                </div>
                <ArrowRight size={18} />
              </Link>
              <Link href="/auth/signup?type=agent">
                <span>
                  <Building2 size={18} />
                </span>
                <div>
                  <strong>Become an Agent</strong>
                  <small>Get verified and receive requests.</small>
                </div>
                <ArrowRight size={18} />
              </Link>
              <div className="hero-request-card-foot">
                <ShieldCheck size={18} />
                <span>Verified matching, Paystack-secured payments, and in-app chat.</span>
              </div>
            </aside>
          </div>
        </article>
      ))}
      <div className="slider-controls" aria-label="Hero slider controls">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show ${slide.kicker}`}
            className={`slider-dot ${active === index ? "active" : ""}`}
            key={`${slide.sort_order}-${slide.kicker}`}
            onClick={() => setActive(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
