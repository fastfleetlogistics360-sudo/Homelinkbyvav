"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountNamesMatch, REFERRAL_MIN_WITHDRAWAL_NAIRA } from "@/lib/referrals";
import { resolvePaystackAccountName } from "@/lib/paystack";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requestWithdrawalAction(formData: FormData) {
  const user = await requireUser();
  const bankName = String(formData.get("bank_name") || "").trim();
  const accountNumber = String(formData.get("account_number") || "").replace(/\D/g, "");
  const submittedAccountName = String(formData.get("account_name") || "").trim();

  if (!bankName || accountNumber.length !== 10) {
    redirect("/dashboard/referrals?withdrawal_error=Enter a bank name and valid 10-digit account number.");
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: wallet }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).single(),
    admin.from("referral_wallets").select("available_balance").eq("user_id", user.id).maybeSingle()
  ]);

  const availableBalance = Number(wallet?.available_balance || 0);
  if (availableBalance < REFERRAL_MIN_WITHDRAWAL_NAIRA) {
    const remaining = REFERRAL_MIN_WITHDRAWAL_NAIRA - availableBalance;
    redirect(`/dashboard/referrals?withdrawal_error=${encodeURIComponent(`You need ₦${remaining.toLocaleString("en-NG")} more to unlock withdrawals.`)}`);
  }

  let resolved;
  try {
    resolved = await resolvePaystackAccountName({ accountNumber, bankName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify bank account.";
    redirect(`/dashboard/referrals?withdrawal_error=${encodeURIComponent(message)}`);
  }

  const accountName = resolved.account_name || submittedAccountName;
  if (!profile?.full_name || !accountNamesMatch(profile.full_name, accountName)) {
    redirect(
      `/dashboard/referrals?withdrawal_error=${encodeURIComponent(
        "Resolved account name must match your HomeLink profile name before withdrawal."
      )}`
    );
  }

  const { error } = await admin.rpc("create_referral_withdrawal_request", {
    target_user_id: user.id,
    target_bank_name: bankName,
    target_account_number: accountNumber,
    target_account_name: accountName,
    target_amount: availableBalance,
    minimum_amount: REFERRAL_MIN_WITHDRAWAL_NAIRA
  });

  if (error) {
    redirect(`/dashboard/referrals?withdrawal_error=${encodeURIComponent(error.message)}`);
  }

  await admin.from("notifications").insert({
    user_id: user.id,
    type: "referral_withdrawal_requested",
    message: "Your Refer & Earn withdrawal request has been submitted for review."
  });

  revalidatePath("/dashboard/referrals");
  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard/seeker");
  redirect("/dashboard/referrals?withdrawal=requested");
}
