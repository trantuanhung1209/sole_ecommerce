import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cartApi, checkoutApi, money } from "@/services/ecommerceServices";
import { formatCartItemLabel } from "@/utils/displayLabels";
import { CartItemLink } from "@/components/cart/CartItemLink";
import { useDebounce } from "@/hooks/useDebounce";
import type { Cart } from "@/types/ecommerce.type";

type CartIssue = { cartItemId?: string; variantId?: string; message: string };

export default function CartPage() {
  const { refresh: refreshGlobalCart } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [issues, setIssues] = useState<CartIssue[]>([]);
  const [valid, setValid] = useState(true);
  const [preview, setPreview] = useState({ shippingFee: 0, grandTotal: 0 });
  const pendingQty = useRef<Map<string, number>>(new Map());
  const debouncedCart = useDebounce(cart, 400);

  const refresh = useCallback(async () => {
    const [cartData, validation, previewData] = await Promise.all([
      cartApi.get(),
      cartApi.validate(),
      checkoutApi.preview().catch(() => ({ itemCount: 0, subtotal: 0, shippingFee: 0, grandTotal: 0, discountTotal: 0, taxTotal: 0 })),
    ]);
    setCart(cartData);
    setIssues(validation.issues);
    setValid(validation.valid);
    setPreview({ shippingFee: previewData.shippingFee, grandTotal: previewData.grandTotal });
    await refreshGlobalCart();
  }, [refreshGlobalCart]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    if (!debouncedCart) return;
    cartApi.validate().then((validation) => {
      setIssues(validation.issues);
      setValid(validation.valid);
    }).catch(console.error);
  }, [debouncedCart]);

  const subtotal = cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) || 0;

  const issueForItem = (cartItemId: string) =>
    issues.find((issue) => issue.cartItemId === cartItemId)?.message;

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    const qty = Math.max(1, quantity);
    pendingQty.current.set(cartItemId, qty);
    await cartApi.update(cartItemId, qty);
    await refresh();
  };

  const remove = async (cartItemId: string) => {
    await cartApi.remove(cartItemId);
    await refresh();
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <h1 className="text-4xl font-bold">Giỏ hàng</h1>
        {!cart || cart.items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
            <h2 className="text-2xl font-bold">Giỏ hàng trống</h2>
            <p className="mt-2 text-[#6B7280]">Bạn chưa thêm sản phẩm nào.</p>
            <Button asChild className="mt-6 bg-[#111111] text-white">
              <Link to="/products">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {!valid && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Một số sản phẩm trong giỏ không còn hợp lệ. Vui lòng cập nhật trước khi thanh toán.
                </div>
              )}
              {cart.items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="relative flex cursor-pointer gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 transition hover:bg-[#FAFAF9]"
                >
                  <CartItemLink item={item} className="absolute inset-0 z-[1] rounded-2xl">
                    <span className="sr-only">Xem chi tiết {formatCartItemLabel(item)}</span>
                  </CartItemLink>

                  <div className="pointer-events-none h-24 w-24 overflow-hidden rounded-xl bg-[#F1F1EF]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-2" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="pointer-events-none">
                      <p className="font-bold">{formatCartItemLabel(item)}</p>
                      {item.sku ? <p className="text-xs text-[#6B7280]">SKU {item.sku}</p> : null}
                      <p className="mt-1 text-sm text-[#6B7280]">{money(item.priceSnapshot)}</p>
                      {issueForItem(item.cartItemId) ? (
                        <p className="mt-2 text-sm text-red-600">{issueForItem(item.cartItemId)}</p>
                      ) : null}
                    </div>
                    <div className="relative z-10 mt-4 flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative z-10 shrink-0"
                    onClick={() => remove(item.cartItemId)}
                    aria-label="Xóa sản phẩm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span>Tạm tính</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between"><span>Phí vận chuyển</span><span>{money(preview.shippingFee)}</span></div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Tổng cộng</span><span>{money(preview.grandTotal || subtotal + preview.shippingFee)}</span></div>
              </div>
              {preview.shippingFee === 0 && subtotal >= 2_000_000 ? (
                <p className="mt-3 text-xs text-green-700">Miễn phí vận chuyển cho đơn từ 2.000.000đ</p>
              ) : null}
              <Button asChild className="mt-6 h-12 w-full rounded-lg bg-[#111111] text-white" disabled={!valid}>
                <Link to={valid ? "/checkout" : "#"} onClick={(e) => !valid && e.preventDefault()}>Thanh toán</Link>
              </Button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
