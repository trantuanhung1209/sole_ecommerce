import { useEffect, useState } from "react";
import { orderApi, paymentApi } from "@/services/ecommerceServices";
import {
  resolveInitialPaymentVerifyState,
  resolvePaymentVerifyFallback,
  resolvePaymentVerifyState,
  type PaymentVerifyState,
} from "@/utils/paymentVerification";

export type { PaymentVerifyState } from "@/utils/paymentVerification";

export function usePaymentVerification(
  orderId: string | null,
  isLoggedIn: boolean,
  expectedOutcome: "success" | "failure" | "cancel"
) {
  const [verifyState, setVerifyState] = useState<PaymentVerifyState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const initial = resolveInitialPaymentVerifyState(orderId, isLoggedIn);
      if (initial !== "loading") {
        setVerifyState(initial);
        return;
      }

      const maxAttempts = 6;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const [order, payment] = await Promise.all([
            orderApi.detail(orderId!),
            paymentApi.byOrder(orderId!).catch(() => null),
          ]);
          if (cancelled) return;

          const resolved = resolvePaymentVerifyState(order, payment, expectedOutcome);
          if (resolved) {
            setVerifyState(resolved);
            return;
          }
        } catch {
          if (cancelled) return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (!cancelled) {
        setVerifyState(resolvePaymentVerifyFallback(expectedOutcome));
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [orderId, isLoggedIn, expectedOutcome]);

  return verifyState;
}
