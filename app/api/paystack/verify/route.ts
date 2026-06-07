import { NextResponse } from "next/server";
import { type AgentPlanId } from "@/lib/constants";
import { matchAgentsForRequest } from "@/lib/agents";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const verified = await verifyPaystackTransaction(reference);
  const paid = verified.status === "success";

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("request_id, provider_payload")
    .eq("reference", reference)
    .single();
  const storedMetadata = toPaymentMetadata(existingPayment?.provider_payload);
  const verifiedMetadata = toPaymentMetadata(verified.metadata);
  const metadata = {
    ...storedMetadata,
    ...verifiedMetadata
  };

  const { data: payment } = await supabase
    .from("payments")
    .update({
      status: paid ? "paid" : verified.status,
      provider_payload: {
        ...metadata,
        paystack: verified
      }
    })
    .eq("reference", reference)
    .select("request_id, provider_payload")
    .single();

  if (metadata.product === "agent_subscription") {
    if (paid && typeof metadata.agent_id === "string" && isPaidAgentPlan(metadata.plan)) {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.rpc("apply_agent_subscription", {
        target_agent_id: metadata.agent_id,
        target_plan: metadata.plan,
        target_expiry: expiry
      });
      return NextResponse.redirect(new URL("/dashboard/agent/subscription?payment=verified", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard/agent/subscription?payment=failed", request.url));
  }

  if (paid && payment?.request_id) {
    await matchAgentsForRequest(payment.request_id, { notify: true });
  }

  return NextResponse.redirect(new URL("/dashboard/seeker?payment=verified", request.url));
}
