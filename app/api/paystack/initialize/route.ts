import { NextResponse } from "next/server";
import { REQUEST_ROUTING_FEE_NAIRA } from "@/lib/constants";
import { initializePaystackTransaction } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("request_id");
  if (!requestId) return NextResponse.redirect(new URL("/dashboard/seeker", request.url));

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(new URL("/auth/login", request.url));

  const { data: seeker } = await supabase
    .from("home_seeker_profiles")
    .select("home_seeker_id")
    .eq("user_id", user.id)
    .single();

  const { data: housingRequest } = await supabase
    .from("housing_requests")
    .select("request_id")
    .eq("request_id", requestId)
    .eq("home_seeker_id", seeker?.home_seeker_id || "")
    .single();

  if (!housingRequest) {
    return NextResponse.redirect(new URL("/dashboard/seeker", request.url));
  }

  const reference = `HL-${requestId}-${Date.now()}`;
  await supabase.from("payments").insert({
    request_id: requestId,
    user_id: user.id,
    provider: "paystack",
    reference,
    amount: REQUEST_ROUTING_FEE_NAIRA,
    currency: "NGN",
    status: "pending"
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const transaction = await initializePaystackTransaction({
    email: user.email,
    amountKobo: REQUEST_ROUTING_FEE_NAIRA * 100,
    reference,
    callbackUrl: `${appUrl}/api/paystack/verify?reference=${reference}`,
    metadata: {
      request_id: requestId,
      user_id: user.id,
      product: "agent_connection_routing_fee"
    }
  });

  return NextResponse.redirect(transaction.authorization_url);
}
