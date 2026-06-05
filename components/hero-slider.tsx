"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";

const slides = [
  {
    kicker: "Request a Home. Get Matched Fast.",
    title: "Submit your apartment request. Verified agents respond.",
    copy: "Tell HomeLink your location, apartment type, bedrooms, budget, rent duration, and move-in date.",
    primary: ["Request a Home", "/auth/signup?type=home_seeker"],
    secondary: ["Join as Agent", "/auth/signup?type=agent"]
  },
  {
    kicker: "Verified agents only",
    title: "Approved agents receive matching requests instantly.",
    copy: "Agents complete KYC and only receive requests inside their approved operating locations and specialties.",
    primary: ["Start Agent Onboarding", "/auth/signup?type=agent"],
    secondary: ["How It Works", "/#how"]
  },
  {
    kicker: "Compare. Chat. Inspect.",
    title: "Chat with agents and move faster.",
    copy: "Compare responses, chat, call, WhatsApp, inspect, and mark your request fulfilled.",
    primary: ["Create Account", "/auth/signup"],
    secondary: ["Learn More", "/#about"]
  }
];

export function HeroSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="hero-slider" aria-label="HomeLink adverts">
      {slides.map((slide, index) => (
        <article
          className={`hero-slide ${active === index ? "active" : ""}`}
          key={slide.title}
          style={{ "--slide-image": "url('/images/homelink-logo.png')" } as CSSProperties}
        >
          <div className="hero-content">
            <p className="kicker">{slide.kicker}</p>
            <h1>{slide.title}</h1>
            <p>{slide.copy}</p>
            <div className="hero-actions">
              <Link className="button primary" href={slide.primary[1]}>
                {slide.primary[0]}
              </Link>
              <Link className="button secondary" href={slide.secondary[1]}>
                {slide.secondary[0]}
              </Link>
            </div>
          </div>
        </article>
      ))}
      <div className="slider-controls" aria-label="Hero slider controls">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show ${slide.kicker}`}
            className={`slider-dot ${active === index ? "active" : ""}`}
            key={slide.title}
            onClick={() => setActive(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
