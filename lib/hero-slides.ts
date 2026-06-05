import { createAdminClient } from "@/lib/supabase/admin";

export type HeroSlide = {
  slide_id?: string;
  sort_order: number;
  image_url: string;
  kicker: string;
  title: string;
  copy: string;
  primary_label: string;
  primary_url: string;
  secondary_label: string;
  secondary_url: string;
  is_active: boolean;
};

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    sort_order: 1,
    image_url: "/images/homelink-logo.png",
    kicker: "Request a Home. Get Matched Fast.",
    title: "Submit your apartment request. Verified agents respond.",
    copy: "Tell HomeLink your location, apartment type, bedrooms, budget, rent duration, and move-in date.",
    primary_label: "Request a Home",
    primary_url: "/auth/signup?type=home_seeker",
    secondary_label: "Join as Agent",
    secondary_url: "/auth/signup?type=agent",
    is_active: true
  },
  {
    sort_order: 2,
    image_url: "/images/homelink-logo.png",
    kicker: "Verified agents only",
    title: "Approved agents receive matching requests instantly.",
    copy: "Agents complete KYC and only receive requests inside their approved operating locations and specialties.",
    primary_label: "Start Agent Onboarding",
    primary_url: "/auth/signup?type=agent",
    secondary_label: "How It Works",
    secondary_url: "/#how",
    is_active: true
  },
  {
    sort_order: 3,
    image_url: "/images/homelink-logo.png",
    kicker: "Compare. Chat. Inspect.",
    title: "Chat with agents and move faster.",
    copy: "Compare responses, chat, call, WhatsApp, inspect, and mark your request fulfilled.",
    primary_label: "Create Account",
    primary_url: "/auth/signup",
    secondary_label: "Learn More",
    secondary_url: "/#about",
    is_active: true
  }
];

export async function getHeroSlides({ includeInactive = false } = {}) {
  try {
    const supabase = createAdminClient();
    let query = supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error || !data?.length) return DEFAULT_HERO_SLIDES;
    return data as HeroSlide[];
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}
