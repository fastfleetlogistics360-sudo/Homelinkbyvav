import { NextResponse } from "next/server";
import { resolvePaystackAccountName } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bankName = String(body?.bank_name || "").trim();
  const accountNumber = String(body?.account_number || "").replace(/\D/g, "");

  if (!bankName || accountNumber.length !== 10) {
    return NextResponse.json({ error: "Enter a bank name and valid 10-digit account number." }, { status: 400 });
  }

  try {
    const resolved = await resolvePaystackAccountName({ bankName, accountNumber });
    return NextResponse.json({
      account_name: resolved.account_name,
      account_number: resolved.account_number
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
