import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { cartApi } from "@/services/ecommerceServices";
import type { Cart } from "@/types/ecommerce.type";

export type FlyToCartPayload = {
  id: string;
  imageUrl: string;
  from: DOMRect;
};

type AddItemOptions = {
  imageUrl?: string;
  sourceElement?: HTMLElement | null;
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
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [flyItems, setFlyItems] = useState<FlyToCartPayload[]>([]);
  const [pulseCart, setPulseCart] = useState(false);
  const cartIconRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    const data = await cartApi.get();
    setCart(data);
  }, []);

  useEffect(() => {
    refresh()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh]);

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

  const addItem = useCallback(
    async (variantId: string, quantity: number, options?: AddItemOptions) => {
      triggerFly(options?.imageUrl || "", options?.sourceElement);
      const updated = await cartApi.add(variantId, quantity);
      setCart(updated);
      return updated;
    },
    [triggerFly]
  );

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      loading,
      cartOpen,
      setCartOpen,
      cartIconRef,
      flyItems,
      refresh,
      addItem,
      removeFlyItem,
      pulseCart,
    }),
    [cart, itemCount, loading, cartOpen, flyItems, refresh, addItem, removeFlyItem, pulseCart]
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
