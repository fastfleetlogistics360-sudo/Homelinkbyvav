import { HeroSliderClient } from "@/components/hero-slider-client";
import { getHeroSlides } from "@/lib/hero-slides";

export async function HeroSlider() {
  const slides = await getHeroSlides();
  return <HeroSliderClient slides={slides} />;
}
