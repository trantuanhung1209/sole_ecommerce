import type { Cart, CartItem } from "@/types/ecommerce.type";
import { productApi } from "@/services/ecommerceServices";

const VARIANT_PRODUCT_REF_KEY = "sole_variant_product_refs";

type VariantProductRef = {
  productId?: string;
  productSlug?: string;
};

function loadVariantRefs(): Record<string, VariantProductRef> {
  try {
    const raw = localStorage.getItem(VARIANT_PRODUCT_REF_KEY);
    return raw ? (JSON.parse(raw) as Record<string, VariantProductRef>) : {};
  } catch {
    return {};
  }
}

function saveVariantRef(variantId: string, ref: VariantProductRef) {
  const refs = loadVariantRefs();
  refs[variantId] = { ...refs[variantId], ...ref };
  localStorage.setItem(VARIANT_PRODUCT_REF_KEY, JSON.stringify(refs));
}

export function rememberVariantProductRef(
  variantId: string,
  ref: { productId?: string; productSlug?: string }
) {
  if (!ref.productId && !ref.productSlug) return;
  saveVariantRef(variantId, ref);
}

export function cartItemProductUrl(item: CartItem): string | null {
  if (item.productSlug) return `/products/${item.productSlug}`;
  if (item.productId) return `/products/${item.productId}`;

  const cached = loadVariantRefs()[item.variantId];
  if (cached?.productSlug) return `/products/${cached.productSlug}`;
  if (cached?.productId) return `/products/${cached.productId}`;

  return null;
}

export async function resolveCartItemProductUrl(item: CartItem): Promise<string | null> {
  const existing = cartItemProductUrl(item);
  if (existing) return existing;

  try {
    const meta = await productApi.variantProductMeta(item.variantId);
    rememberVariantProductRef(item.variantId, meta);
    return `/products/${meta.slug || meta.productId}`;
  } catch {
    return null;
  }
}

export function enrichCartItems(cart: Cart): Cart {
  const refs = loadVariantRefs();
  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      productId: item.productId ?? refs[item.variantId]?.productId,
      productSlug: item.productSlug ?? refs[item.variantId]?.productSlug,
    })),
  };
}
