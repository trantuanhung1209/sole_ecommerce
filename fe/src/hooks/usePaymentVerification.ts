import { useEffect, useState } from "react";
import { orderApi, paymentApi } from "@/services/ecommerceServices";

export type PaymentVerifyState =
  | "loading"
  | "confirmed"
  | "pending"
  | "failed"
  | "cancelled"
  | "unauthenticated";

export function usePaymentVerification(
  orderId: string | null,
  isLoggedIn: boolean,
  expectedOutcome: "success" | "failure" | "cancel"
) {
  const [verifyState, setVerifyState] = useState<PaymentVerifyState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!orderId) {
        setVerifyState("pending");
        return;
      }
      if (!isLoggedIn) {
        setVerifyState("unauthenticated");
        return;
      }

      const maxAttempts = 6;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const [order, payment] = await Promise.all([
            orderApi.detail(orderId),
            paymentApi.byOrder(orderId).catch(() => null),
          ]);
          if (cancelled) return;

          const paid =
            order.paymentStatus === "COMPLETED" ||
            order.status === "PAID" ||
            payment?.status === "COMPLETED";
          const failed =
            payment?.status === "FAILED" ||
            payment?.status === "EXPIRED" ||
            order.status === "CANCELLED";
          const pendingPayment =
            order.status === "PENDING_PAYMENT" &&
            payment?.status === "PENDING";

          if (expectedOutcome === "success" && paid) {
            setVerifyState("confirmed");
            return;
          }
          if (expectedOutcome === "failure" && failed) {
            setVerifyState("failed");
            return;
          }
          if (expectedOutcome === "cancel" && (pendingPayment || failed)) {
            setVerifyState(pendingPayment ? "cancelled" : "failed");
            return;
          }
          if (expectedOutcome === "failure" && paid) {
            setVerifyState("confirmed");
            return;
          }
        } catch {
          if (cancelled) return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (!cancelled) {
        setVerifyState(expectedOutcome === "success" ? "pending" : expectedOutcome === "cancel" ? "cancelled" : "failed");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [orderId, isLoggedIn, expectedOutcome]);

  return verifyState;
}
