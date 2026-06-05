import { createAdminClient } from "@/lib/supabase/admin";

export type Testimonial = {
  testimonial_id?: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  message: string;
  profile_photo: string | null;
  is_featured: boolean;
  is_approved: boolean;
  is_enabled: boolean;
  created_at?: string;
};

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    name: "Mariam A.",
    role: "Home seeker",
    location: "Yaba, Lagos",
    rating: 5,
    message:
      "I stopped jumping from one agent to another. I sent one request and got clear responses from agents who actually understood my budget.",
    profile_photo: null,
    is_featured: true,
    is_approved: true,
    is_enabled: true
  },
  {
    name: "Tunde Bello",
    role: "Verified agent",
    location: "Ibadan, Oyo",
    rating: 5,
    message:
      "HomeLink gives me serious clients in my area. The request details are clear, so I can respond with the right apartment fast.",
    profile_photo: null,
    is_featured: true,
    is_approved: true,
    is_enabled: true
  },
  {
    name: "Chinwe Okafor",
    role: "Home seeker",
    location: "Lekki, Lagos",
    rating: 4,
    message:
      "The best part was comparing agent responses before making calls. It made the search feel calmer and more transparent.",
    profile_photo: null,
    is_featured: false,
    is_approved: true,
    is_enabled: true
  }
];

export async function getTestimonials({ includeAdmin = false } = {}) {
  try {
    const supabase = createAdminClient();
    let query = supabase.from("testimonials").select("*").order("is_featured", { ascending: false }).order("created_at", { ascending: false });
    if (!includeAdmin) query = query.eq("is_approved", true).eq("is_enabled", true);
    const { data, error } = await query;
    if (error || !data?.length) return includeAdmin ? [] : FALLBACK_TESTIMONIALS;
    return data as Testimonial[];
  } catch {
    return includeAdmin ? [] : FALLBACK_TESTIMONIALS;
  }
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
