import { describe, expect, it } from "vitest";
import type { AiSuggestedProduct } from "@/types/ai.type";

describe("ai chat types", () => {
  it("supports suggested product payload shape", () => {
    const product: AiSuggestedProduct = {
      productId: "p1",
      name: "Runner",
      slug: "runner",
      minPrice: 1_000_000,
      imageUrl: "https://example.com/runner.jpg",
    };
    expect(product.slug).toBe("runner");
  });
});
