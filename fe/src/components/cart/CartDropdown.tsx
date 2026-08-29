import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { money } from "@/services/ecommerceServices";
import { formatCartItemLabel } from "@/utils/displayLabels";
import { CartItemLink } from "@/components/cart/CartItemLink";

const placeholder =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80";

const HOVER_CLOSE_DELAY_MS = 180;

export function CartDropdown() {
  const navigate = useNavigate();
  const { cart, itemCount, loading, cartOpen, setCartOpen, cartIconRef, pulseCart } = useCart();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) ?? 0;

  const openCart = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setCartOpen(true);
  };

  const scheduleCloseCart = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setCartOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  return (
    <Popover open={cartOpen} onOpenChange={setCartOpen}>
      <div onMouseEnter={openCart} onMouseLeave={scheduleCloseCart}>
        <PopoverTrigger asChild>
          <motion.button
            ref={cartIconRef}
            type="button"
            data-cart-icon-target=""
            aria-label="Giỏ hàng"
            animate={pulseCart ? { scale: [1, 1.14, 1] } : { scale: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 0.82, 0.22, 1] }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111111] transition hover:border-[#111111] hover:bg-[#F7F7F5]"
          >
            <ShoppingCart className="h-5 w-5" />
            {!loading && itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E53935] px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </motion.button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="end"
        sideOffset={10}
        onMouseEnter={openCart}
        onMouseLeave={scheduleCloseCart}
        className="w-[min(92vw,380px)] rounded-2xl border-[#E5E7EB] bg-white p-0 shadow-xl hover:bg-white"
      >
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <p className="text-sm font-bold">Giỏ hàng</p>
          <p className="text-xs text-[#6B7280]">
            {itemCount > 0 ? `${itemCount} sản phẩm` : "Chưa có sản phẩm"}
          </p>
        </div>

        <div className="max-h-[320px] overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl bg-[#F1F1EF]" />
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="py-6 text-center">
              <ShoppingCart className="mx-auto h-8 w-8 text-[#9CA3AF]" />
              <p className="mt-3 text-sm font-semibold">Giỏ hàng trống</p>
              <p className="mt-1 text-xs text-[#6B7280]">Thêm sản phẩm để bắt đầu mua sắm.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.items.map((item) => (
                <li key={item.cartItemId}>
                  <CartItemLink
                    item={item}
                    onNavigate={() => setCartOpen(false)}
                    className="-mx-2 rounded-xl px-2 py-2"
                  >
                    <div className="flex gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F1F1EF]">
                        <img
                          src={item.imageUrl || placeholder}
                          alt=""
                          className="h-full w-full object-contain p-1.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold">{formatCartItemLabel(item)}</p>
                        <p className="mt-0.5 text-xs text-[#6B7280]">
                          {item.quantity} × {money(item.priceSnapshot)}
                        </p>
                      </div>
                    </div>
                  </CartItemLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.items.length > 0 ? (
          <div className="border-t border-[#E5E7EB] px-4 py-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">Tạm tính</span>
              <span className="font-bold">{money(subtotal)}</span>
            </div>
            <div className="grid gap-2">
              <Button
                className="h-11 w-full rounded-lg bg-[#111111] text-white"
                onClick={() => {
                  setCartOpen(false);
                  navigate("/checkout");
                }}
              >
                Thanh toán
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-lg border-[#D1D5DB]"
                onClick={() => setCartOpen(false)}
              >
                <Link to="/cart">Xem tất cả</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-[#E5E7EB] px-4 py-4">
            <Button asChild variant="outline" className="h-11 w-full rounded-lg border-[#D1D5DB]">
              <Link to="/products" onClick={() => setCartOpen(false)}>
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
