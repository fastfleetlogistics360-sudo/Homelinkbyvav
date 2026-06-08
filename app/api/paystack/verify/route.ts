import { NextResponse } from "next/server";
import { type AgentPlanId } from "@/lib/constants";
import { matchAgentsForRequest } from "@/lib/agents";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { grantAgentPremiumReferralBonus, qualifyHomeSeekerReferral } from "@/lib/referrals";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentMetadata = {
  product?: unknown;
  agent_id?: unknown;
  plan?: unknown;
  [key: string]: unknown;
};

function toPaymentMetadata(value: unknown): PaymentMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as PaymentMetadata;
  return {};
}

function isPaidAgentPlan(plan: unknown): plan is Exclude<AgentPlanId, "free"> {
  return plan === "premium" || plan === "platinum";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/dashboard/seeker", request.url));

  const admin = createAdminClient();
  const verified = await verifyPaystackTransaction(reference);
  const paid = verified.status === "success";

  const { data: existingPayment } = await admin
    .from("payments")
    .select("request_id, user_id, provider_payload")
    .eq("reference", reference)
    .single();
  const storedMetadata = toPaymentMetadata(existingPayment?.provider_payload);
  const verifiedMetadata = toPaymentMetadata(verified.metadata);
  const metadata = {
    ...storedMetadata,
    ...verifiedMetadata
  };

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .update({
      status: paid ? "paid" : verified.status,
      provider_payload: {
        ...metadata,
        paystack: verified
      }
    })
    .eq("reference", reference)
    .select("request_id, user_id, provider_payload")
    .single();

  if (paymentError) {
    console.error("Paystack payment verification could not update payment row.", paymentError);
    const failurePath =
      metadata.product === "agent_subscription"
        ? "/dashboard/agent/subscription?payment=failed"
        : "/dashboard/seeker?payment=failed";
    return NextResponse.redirect(new URL(failurePath, request.url));
  }

  if (metadata.product === "agent_subscription") {
    if (paid && typeof metadata.agent_id === "string" && isPaidAgentPlan(metadata.plan)) {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await admin.rpc("apply_agent_subscription", {
        target_agent_id: metadata.agent_id,
        target_plan: metadata.plan,
        target_expiry: expiry
      });
      if (typeof metadata.user_id === "string") {
        await grantAgentPremiumReferralBonus(metadata.user_id);
      }
      return NextResponse.redirect(new URL("/dashboard/agent/subscription?payment=verified", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard/agent/subscription?payment=failed", request.url));
  }

  if (paid && payment?.request_id) {
    await matchAgentsForRequest(payment.request_id, { notify: true });
    if (payment.user_id) {
      await qualifyHomeSeekerReferral(payment.user_id);
    }
  }

  return NextResponse.redirect(new URL("/dashboard/seeker?payment=verified", request.url));
}
