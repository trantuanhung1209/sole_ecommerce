import { describe, expect, it } from "vitest";
import { applyOptimisticAdd } from "./cartOptimistic";
import type { Cart } from "@/types/ecommerce.type";

const baseCart: Cart = {
  cartId: "c1",
  userId: "u1",
  status: "ACTIVE",
  items: [
    {
      cartItemId: "ci1",
      variantId: "v1",
      quantity: 2,
      priceSnapshot: 1000000,
      addedAt: "2026-01-01T00:00:00Z",
      productName: "Nike Dunk",
    },
  ],
};

describe("applyOptimisticAdd", () => {
  it("increments quantity when variant already exists", () => {
    const next = applyOptimisticAdd(baseCart, {
      variantId: "v1",
      quantity: 1,
      productName: "Nike Dunk",
      price: 1000000,
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(3);
  });

  it("appends a new optimistic line for a new variant", () => {
    const next = applyOptimisticAdd(baseCart, {
      variantId: "v2",
      quantity: 1,
      productName: "Jordan 1",
      price: 4590000,
      productSlug: "air-jordan-1",
    });

    expect(next.items).toHaveLength(2);
    expect(next.items[1].variantId).toBe("v2");
    expect(next.items[1].quantity).toBe(1);
    expect(next.items[1].productSlug).toBe("air-jordan-1");
  });
});
