import type { Order } from "@/types/ecommerce.type";

export type PaymentVerifyState =
  | "loading"
  | "confirmed"
  | "pending"
  | "failed"
  | "cancelled"
  | "unauthenticated";

export interface PaymentSnapshot {
  status?: string;
}

export function resolveInitialPaymentVerifyState(
  orderId: string | null,
  isLoggedIn: boolean
): PaymentVerifyState {
  if (!orderId) return "pending";
  if (!isLoggedIn) return "unauthenticated";
  return "loading";
}

export function resolvePaymentVerifyState(
  order: Pick<Order, "status" | "paymentStatus">,
  payment: PaymentSnapshot | null,
  expectedOutcome: "success" | "failure" | "cancel"
): PaymentVerifyState | null {
  const paid =
    order.paymentStatus === "COMPLETED" ||
    order.status === "PAID" ||
    payment?.status === "COMPLETED";
  const failed =
    payment?.status === "FAILED" ||
    payment?.status === "EXPIRED" ||
    order.status === "CANCELLED";
  const pendingPayment =
    order.status === "PENDING_PAYMENT" && payment?.status === "PENDING";

  if (expectedOutcome === "success" && paid) return "confirmed";
  if (expectedOutcome === "failure" && failed) return "failed";
  if (expectedOutcome === "cancel" && (pendingPayment || failed)) {
    return pendingPayment ? "cancelled" : "failed";
  }
  if (expectedOutcome === "failure" && paid) return "confirmed";
  return null;
}

export function resolvePaymentVerifyFallback(
  expectedOutcome: "success" | "failure" | "cancel"
): PaymentVerifyState {
  if (expectedOutcome === "success") return "pending";
  if (expectedOutcome === "cancel") return "cancelled";
  return "failed";
}
