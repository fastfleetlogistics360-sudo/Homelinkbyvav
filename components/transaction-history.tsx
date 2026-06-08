import { isSuccessfulPayment, paymentStatusLabel } from "@/lib/payment-status";

type PaymentRow = {
  payment_id: string;
  reference: string;
  amount: number | string;
  currency: string;
  status: string;
  provider: string;
  request_id?: string | null;
  provider_payload?: unknown;
  created_at: string;
};

function productLabel(payment: PaymentRow) {
  if (payment.reference?.startsWith("HL-SUB")) return "Agent subscription";
  if (payment.request_id) return "Agent connection fee";

  const payload = payment.provider_payload;
  if (payload && typeof payload === "object" && "product" in payload) {
    return String(payload.product).replaceAll("_", " ");
  }

  return "HomeLink payment";
}

function formatAmount(payment: PaymentRow) {
  return new Intl.NumberFormat("en-NG", {
    currency: payment.currency || "NGN",
    style: "currency",
    maximumFractionDigits: 0
  }).format(Number(payment.amount || 0));
}

export function TransactionHistory({ payments }: { payments: PaymentRow[] }) {
  return (
    <section className="panel transaction-panel" id="transactions">
      <div className="response-title-row">
        <div>
          <p className="kicker">Transaction History</p>
          <h2>Payments and receipts</h2>
        </div>
        <span className="badge">{payments.length}</span>
      </div>
      {payments.length ? (
        <div className="transaction-list">
          {payments.map((payment) => (
            <article className="transaction-row" key={payment.payment_id}>
              <div>
                <strong>{productLabel(payment)}</strong>
                <span>{payment.reference}</span>
              </div>
              <div>
                <strong>{formatAmount(payment)}</strong>
                <span>{new Date(payment.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
              </div>
              <span className={`badge ${isSuccessfulPayment(payment) ? "approved" : "pending"}`}>{paymentStatusLabel(payment)}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No transactions yet.</h3>
          <p>Your routing fees and subscription payments will appear here once completed.</p>
        </div>
      )}
    </section>
  );
}
