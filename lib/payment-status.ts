const SUCCESSFUL_PAYMENT_STATUSES = new Set(["paid", "success", "successful", "completed"]);

type PaymentStatusLike = {
  status?: string | null;
  provider_payload?: unknown;
};

function readStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function payloadStatus(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const payload = value as Record<string, unknown>;
  const directStatus = readStatus(payload.status);
  if (directStatus) return directStatus;

  const paystack = payload.paystack;
  if (paystack && typeof paystack === "object" && !Array.isArray(paystack)) {
    return readStatus((paystack as Record<string, unknown>).status);
  }

  return "";
}

export function isSuccessfulPayment(payment: PaymentStatusLike) {
  return SUCCESSFUL_PAYMENT_STATUSES.has(readStatus(payment.status)) || SUCCESSFUL_PAYMENT_STATUSES.has(payloadStatus(payment.provider_payload));
}

export function paymentStatusLabel(payment: PaymentStatusLike) {
  if (isSuccessfulPayment(payment)) return "SUCCESSFUL";
  const status = readStatus(payment.status);
  return status ? status.toUpperCase() : "PENDING";
}
