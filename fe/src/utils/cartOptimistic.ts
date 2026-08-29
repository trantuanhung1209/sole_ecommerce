import type { Cart, CartItem } from "@/types/ecommerce.type";

export type OptimisticCartItemInput = {
  variantId: string;
  quantity: number;
  productId?: string;
  productSlug?: string;
  productName?: string;
  imageUrl?: string;
  price?: number;
  sku?: string;
  size?: string;
  colorName?: string;
};

const emptyCart = (): Cart => ({
  cartId: "optimistic",
  userId: "",
  status: "ACTIVE",
  items: [],
});

export function applyOptimisticAdd(cart: Cart | null | undefined, input: OptimisticCartItemInput): Cart {
  const base = cart ?? emptyCart();
  const existing = base.items.find((item) => item.variantId === input.variantId);

  if (existing) {
    return {
      ...base,
      items: base.items.map((item) =>
        item.variantId === input.variantId
          ? { ...item, quantity: item.quantity + input.quantity }
          : item
      ),
    };
  }

  const optimisticItem: CartItem = {
    cartItemId: `optimistic-${input.variantId}-${Date.now()}`,
    variantId: input.variantId,
    quantity: input.quantity,
    priceSnapshot: input.price ?? 0,
    addedAt: new Date().toISOString(),
    productName: input.productName,
    imageUrl: input.imageUrl,
    productId: input.productId,
    productSlug: input.productSlug,
    sku: input.sku,
    size: input.size,
    colorName: input.colorName,
  };

  return {
    ...base,
    items: [...base.items, optimisticItem],
  };
}
