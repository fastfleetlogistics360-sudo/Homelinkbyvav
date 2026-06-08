import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const referralCode = normalizeCode(code);
  const redirectUrl = new URL("/auth/signup", request.url);

  if (!referralCode) {
    return NextResponse.redirect(redirectUrl);
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_codes")
    .select("referral_code")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (data?.referral_code) {
    redirectUrl.searchParams.set("ref", data.referral_code);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("homelink_referral_code", data.referral_code, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    return response;
  }

  redirectUrl.searchParams.set("error", "Referral code not found.");
  return NextResponse.redirect(redirectUrl);
}
