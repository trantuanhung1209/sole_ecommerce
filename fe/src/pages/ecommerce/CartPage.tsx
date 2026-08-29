import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartApi, money } from "@/services/ecommerceServices";
import { formatCartItemLabel } from "@/utils/displayLabels";
import type { Cart } from "@/types/ecommerce.type";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    cartApi.get().then(setCart);
  }, []);

  const subtotal = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) || 0,
    [cart]
  );

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setCart(await cartApi.update(cartItemId, Math.max(1, quantity)));
  };

  const remove = async (cartItemId: string) => {
    setCart(await cartApi.remove(cartItemId));
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
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="flex gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
                  <div className="h-24 w-24 overflow-hidden rounded-xl bg-[#F1F1EF]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-2" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{formatCartItemLabel(item)}</p>
                    {item.sku ? <p className="text-xs text-[#6B7280]">SKU {item.sku}</p> : null}
                    <p className="mt-1 text-sm text-[#6B7280]">{money(item.priceSnapshot)}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => remove(item.cartItemId)} aria-label="Xóa sản phẩm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span>Tạm tính</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between"><span>Phí vận chuyển</span><span>{money(30000)}</span></div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Tổng cộng</span><span>{money(subtotal + 30000)}</span></div>
              </div>
              <Button asChild className="mt-6 h-12 w-full rounded-lg bg-[#111111] text-white">
                <Link to="/checkout">Thanh toán</Link>
              </Button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
