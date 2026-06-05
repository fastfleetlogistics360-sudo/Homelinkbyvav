"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { type HeroSlide } from "@/lib/hero-slides";

export function HeroSliderClient({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
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
