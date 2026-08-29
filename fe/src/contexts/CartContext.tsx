import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { cartApi } from "@/services/ecommerceServices";
import { cartQueryKeys } from "@/lib/queryClient";
import type { Cart } from "@/types/ecommerce.type";
import { applyOptimisticAdd, type OptimisticCartItemInput } from "@/utils/cartOptimistic";
import { enrichCartItems, rememberVariantProductRef } from "@/utils/cartNavigation";

export type FlyToCartPayload = {
  id: string;
  imageUrl: string;
  from: DOMRect;
};

export type AddItemOptions = {
  imageUrl?: string;
  sourceElement?: HTMLElement | null;
  productId?: string;
  productSlug?: string;
  productName?: string;
  price?: number;
  sku?: string;
  size?: string;
  colorName?: string;
};

type CartContextValue = {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartIconRef: RefObject<HTMLButtonElement | null>;
  flyItems: FlyToCartPayload[];
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity: number, options?: AddItemOptions) => Promise<Cart>;
  removeFlyItem: (id: string) => void;
  pulseCart: boolean;
  isAddingToCart: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

async function fetchCart(): Promise<Cart> {
  return enrichCartItems(await cartApi.get());
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Không thể thêm vào giỏ hàng";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [cartOpen, setCartOpen] = useState(false);
  const [flyItems, setFlyItems] = useState<FlyToCartPayload[]>([]);
  const [pulseCart, setPulseCart] = useState(false);
  const cartIconRef = useRef<HTMLButtonElement>(null);

  const { data: cart = null, isLoading } = useQuery({
    queryKey: cartQueryKeys.all,
    queryFn: fetchCart,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
  }, [queryClient]);

  const triggerFly = useCallback((imageUrl: string, sourceElement?: HTMLElement | null) => {
    if (!sourceElement || !imageUrl) return;

    const cartEl =
      cartIconRef.current ?? document.querySelector<HTMLElement>("[data-cart-icon-target]");
    if (!cartEl) return;

    const cartRect = cartEl.getBoundingClientRect();
    if (cartRect.width <= 0 || cartRect.height <= 0) return;

    const from = sourceElement.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setFlyItems((prev) => [...prev, { id, imageUrl, from }]);
  }, []);

  const removeFlyItem = useCallback((id: string) => {
    setFlyItems((prev) => prev.filter((item) => item.id !== id));
    setPulseCart(true);
    window.setTimeout(() => setPulseCart(false), 520);
  }, []);

  const addToCartMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: OptimisticCartItemInput) =>
      enrichCartItems(await cartApi.add(variantId, quantity)),

    onMutate: async (input: OptimisticCartItemInput) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.all });

      const previousCart = queryClient.getQueryData<Cart>(cartQueryKeys.all);

      queryClient.setQueryData<Cart>(cartQueryKeys.all, (old) =>
        applyOptimisticAdd(old, {
          variantId: input.variantId,
          quantity: input.quantity,
          productId: input.productId,
          productSlug: input.productSlug,
          productName: input.productName,
          imageUrl: input.imageUrl,
          price: input.price,
          sku: input.sku,
          size: input.size,
          colorName: input.colorName,
        })
      );

      return { previousCart };
    },

    onError: (error, _input, context) => {
      queryClient.setQueryData(cartQueryKeys.all, context?.previousCart ?? null);
      toast.error(extractErrorMessage(error));
    },

    onSuccess: () => {
      toast.success("Đã thêm vào giỏ hàng");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
    },
  });

  const addItem = useCallback(
    async (variantId: string, quantity: number, options?: AddItemOptions) => {
      triggerFly(options?.imageUrl || "", options?.sourceElement);
      rememberVariantProductRef(variantId, {
        productId: options?.productId,
        productSlug: options?.productSlug,
      });

      return addToCartMutation.mutateAsync({
        variantId,
        quantity,
        productId: options?.productId,
        productSlug: options?.productSlug,
        productName: options?.productName,
        imageUrl: options?.imageUrl,
        price: options?.price,
        sku: options?.sku,
        size: options?.size,
        colorName: options?.colorName,
      });
    },
    [addToCartMutation, triggerFly]
  );

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      loading: isLoading,
      cartOpen,
      setCartOpen,
      cartIconRef,
      flyItems,
      refresh,
      addItem,
      removeFlyItem,
      pulseCart,
      isAddingToCart: addToCartMutation.isPending,
    }),
    [
      cart,
      itemCount,
      isLoading,
      cartOpen,
      flyItems,
      refresh,
      addItem,
      removeFlyItem,
      pulseCart,
      addToCartMutation.isPending,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
