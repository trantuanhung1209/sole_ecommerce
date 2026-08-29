import { describe, expect, it } from "vitest";
import {
  resolveInitialPaymentVerifyState,
  resolvePaymentVerifyFallback,
  resolvePaymentVerifyState,
} from "@/utils/paymentVerification";
import {
  calculateGrandTotal,
  calculateShippingFee,
  calculateVat,
} from "@/utils/checkoutPricing";

describe("paymentVerification utils", () => {
  it("returns pending when orderId missing", () => {
    expect(resolveInitialPaymentVerifyState(null, true)).toBe("pending");
  });

  it("returns unauthenticated when guest", () => {
    expect(resolveInitialPaymentVerifyState("o1", false)).toBe("unauthenticated");
  });

  it("confirms success when order is PAID", () => {
    expect(
      resolvePaymentVerifyState(
        { status: "PAID", paymentStatus: "PENDING" },
        null,
        "success"
      )
    ).toBe("confirmed");
  });

  it("confirms failure page when payment actually completed", () => {
    expect(
      resolvePaymentVerifyState(
        { status: "PENDING_PAYMENT", paymentStatus: "COMPLETED" },
        { status: "COMPLETED" },
        "failure"
      )
    ).toBe("confirmed");
  });

  it("marks cancel flow when payment still pending", () => {
    expect(
      resolvePaymentVerifyState(
        { status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
        { status: "PENDING" },
        "cancel"
      )
    ).toBe("cancelled");
  });

  it("fallback failed for failure outcome after retries", () => {
    expect(resolvePaymentVerifyFallback("failure")).toBe("failed");
  });
});

describe("checkoutPricing utils", () => {
  it("calculates grand total with discount and VAT", () => {
    expect(
      calculateGrandTotal({
        subtotal: 1_000_000,
        discountTotal: 100_000,
        shippingFee: 30_000,
        taxTotal: 72_000,
      })
    ).toBe(1_002_000);
  });

  it("never returns negative grand total", () => {
    expect(
      calculateGrandTotal({
        subtotal: 50_000,
        discountTotal: 100_000,
        shippingFee: 0,
        taxTotal: 0,
      })
    ).toBe(0);
  });

  it("free shipping at threshold edge", () => {
    expect(calculateShippingFee(2_000_000)).toBe(0);
    expect(calculateShippingFee(1_999_999)).toBe(30_000);
    expect(calculateShippingFee(0)).toBe(0);
  });

  it("VAT zero when rate is zero", () => {
    expect(calculateVat(1_000_000, 0)).toBe(0);
  });

  it("VAT applied on taxable amount", () => {
    expect(calculateVat(900_000, 0.08)).toBe(72_000);
  });
});
