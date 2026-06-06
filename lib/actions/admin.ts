"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminPasswordMatches, clearAdminSession, createAdminSession, isAdminEmail, requireAdminUser } from "@/lib/admin-auth";
import { DEFAULT_HERO_SLIDES } from "@/lib/hero-slides";
import { uploadHeroSlideImage, uploadTestimonialPhoto } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!isAdminEmail(email)) {
    redirect("/admin?error=Use the approved admin email to continue.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (!adminPasswordMatches(password)) {
      redirect(`/admin?error=${encodeURIComponent("Invalid admin email or password.")}`);
    }

    await createAdminSession(email);
    revalidatePath("/admin");
    redirect("/admin");
  }

  await createAdminSession(email);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateAgentKycStatusAction(formData: FormData) {
  const user = await requireAdminUser();
  const agentId = String(formData.get("agent_id") || "");
  const status = String(formData.get("status") || "");

  if (!agentId || (status !== "approved" && status !== "rejected")) {
    redirect("/admin?error=Invalid KYC action.");
  }

  const supabase = createAdminClient();
  const { data: agent } = await supabase.from("agent_profiles").select("user_id, agency_name").eq("agent_id", agentId).single();
  await supabase.from("agent_profiles").update({ kyc_status: status }).eq("agent_id", agentId);

  if (agent?.user_id) {
    await supabase.from("notifications").insert({
      user_id: agent.user_id,
      type: status === "approved" ? "agent_kyc_approved" : "agent_kyc_rejected",
      message:
        status === "approved"
          ? "Your HomeLink agent KYC has been approved."
          : "Your HomeLink agent KYC was rejected. Please update your details and submit again."
    });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/agent");
  redirect(`/admin?message=${encodeURIComponent(`${agent?.agency_name || "Agent"} KYC ${status} by ${user.email}.`)}`);
}

export async function saveHeroSlideAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();
  const slideId = String(formData.get("slide_id") || "");
  const sortOrder = Number(formData.get("sort_order") || 1);
  const fallback = DEFAULT_HERO_SLIDES[Math.max(sortOrder - 1, 0)] || DEFAULT_HERO_SLIDES[0];
  const existingImage = String(formData.get("existing_image_url") || fallback.image_url);
  const uploadedImage = await uploadHeroSlideImage(sortOrder, formData.get("image_file"));

  const payload = {
    sort_order: sortOrder,
    image_url: uploadedImage || existingImage,
    kicker: String(formData.get("kicker") || fallback.kicker),
    title: String(formData.get("title") || fallback.title),
    copy: String(formData.get("copy") || fallback.copy),
    primary_label: String(formData.get("primary_label") || fallback.primary_label),
    primary_url: String(formData.get("primary_url") || fallback.primary_url),
    secondary_label: String(formData.get("secondary_label") || fallback.secondary_label),
    secondary_url: String(formData.get("secondary_url") || fallback.secondary_url),
    is_active: formData.get("is_active") === "on"
  };

  if (slideId) {
    await supabase.from("hero_slides").update(payload).eq("slide_id", slideId);
  } else {
    await supabase.from("hero_slides").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?message=Hero slide saved.");
}

export async function saveTestimonialAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();
  const testimonialId = String(formData.get("testimonial_id") || "");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const rawRating = Number(formData.get("rating") || 5);
  const rating = Number.isFinite(rawRating) ? Math.min(Math.max(rawRating, 1), 5) : 5;

  if (!name || !role || !location || !message) {
    redirect("/admin?error=Please complete all testimonial fields.");
  }

  const photoKey = testimonialId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const uploadedPhoto = await uploadTestimonialPhoto(photoKey, formData.get("profile_photo_file"));
  const existingPhoto = String(formData.get("existing_profile_photo") || "");

  const payload = {
    name,
    role,
    location,
    rating,
    message,
    profile_photo: uploadedPhoto || existingPhoto || null,
    is_featured: formData.get("is_featured") === "on",
    is_approved: formData.get("is_approved") === "on",
    is_enabled: formData.get("is_enabled") === "on"
  };

  if (testimonialId) {
    await supabase.from("testimonials").update(payload).eq("testimonial_id", testimonialId);
  } else {
    await supabase.from("testimonials").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?message=Testimonial saved.");
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireAdminUser();
  const testimonialId = String(formData.get("testimonial_id") || "");
  if (!testimonialId) redirect("/admin?error=Invalid testimonial.");

  const supabase = createAdminClient();
  await supabase.from("testimonials").delete().eq("testimonial_id", testimonialId);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?message=Testimonial deleted.");
}

export async function updateTestimonialStatusAction(formData: FormData) {
  await requireAdminUser();
  const testimonialId = String(formData.get("testimonial_id") || "");
  const field = String(formData.get("field") || "");
  const value = formData.get("value") === "true";
  const allowedFields = ["is_approved", "is_enabled", "is_featured"];

  if (!testimonialId || !allowedFields.includes(field)) {
    redirect("/admin?error=Invalid testimonial action.");
  }

  const supabase = createAdminClient();
  await supabase.from("testimonials").update({ [field]: value }).eq("testimonial_id", testimonialId);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?message=Testimonial status updated.");
}
