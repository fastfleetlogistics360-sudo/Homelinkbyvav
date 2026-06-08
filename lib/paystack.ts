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

type PaystackBank = {
  name: string;
  code: string;
  slug?: string;
};

function normalizeBankName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bbank\b/g, "")
    .trim();
}

async function getPaystackBanks() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY.");

  const response = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=200", {
    headers: {
      Authorization: `Bearer ${secret}`
    },
    next: { revalidate: 86400 }
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Unable to load Paystack banks.");
  }

  return data.data as PaystackBank[];
}

async function resolveBankCode(bankNameOrCode: string) {
  const value = bankNameOrCode.trim();
  if (/^\d{3,}$/.test(value)) return value;

  const banks = await getPaystackBanks();
  const normalized = normalizeBankName(value);
  const bank =
    banks.find((item) => normalizeBankName(item.name) === normalized || item.slug === normalized) ||
    banks.find((item) => normalizeBankName(item.name).includes(normalized) || normalized.includes(normalizeBankName(item.name)));

  if (!bank) throw new Error("Bank name could not be matched to a Paystack bank.");
  return bank.code;
}

export async function resolvePaystackAccountName({
  accountNumber,
  bankName
}: {
  accountNumber: string;
  bankName: string;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY.");

  const bankCode = await resolveBankCode(bankName);
  const cleanAccountNumber = accountNumber.replace(/\D/g, "");
  if (cleanAccountNumber.length !== 10) throw new Error("Enter a valid 10-digit account number.");

  const params = new URLSearchParams({
    account_number: cleanAccountNumber,
    bank_code: bankCode
  });

  const response = await fetch(`https://api.paystack.co/bank/resolve?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Unable to resolve account name.");
  }

  return data.data as { account_number: string; account_name: string; bank_id?: number };
}
