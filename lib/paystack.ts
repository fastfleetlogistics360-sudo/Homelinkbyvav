type PaystackInitPayload = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

export async function initializePaystackTransaction(payload: PaystackInitPayload) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY.");

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: payload.email,
      amount: payload.amountKobo,
      reference: payload.reference,
      callback_url: payload.callbackUrl,
      metadata: payload.metadata
    })
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Unable to initialize Paystack transaction.");
  }
  return data.data as { authorization_url: string; reference: string; access_code: string };
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY.");

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Unable to verify Paystack transaction.");
  }
  return data.data as { status: string; reference: string; amount: number; metadata?: Record<string, unknown> };
}
