import { NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/dashboard/seeker", request.url));

  const supabase = await createClient();
  const verified = await verifyPaystackTransaction(reference);
  const paid = verified.status === "success";

  const { data: payment } = await supabase
    .from("payments")
    .update({
      status: paid ? "paid" : verified.status,
      provider_payload: verified
    })
    .eq("reference", reference)
    .select("request_id")
    .single();

  if (paid && payment?.request_id) {
    await supabase.from("housing_requests").update({ status: "matched" }).eq("request_id", payment.request_id);
    await supabase.rpc("notify_matched_agents", { target_request_id: payment.request_id });
  }

  return NextResponse.redirect(new URL("/dashboard/seeker?payment=verified", request.url));
}
