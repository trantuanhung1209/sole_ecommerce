import { money } from "@/services/ecommerceServices";
import type { Order } from "@/types/ecommerce.type";

type OrderTotalsProps = {
  order: Pick<
    Order,
    "subtotal" | "discountTotal" | "shippingFee" | "taxTotal" | "grandTotal" | "couponCode"
  >;
  className?: string;
};

export function OrderTotals({ order, className = "" }: OrderTotalsProps) {
  return (
    <div className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between">
        <span className="text-[#6B7280]">Tạm tính</span>
        <span>{money(order.subtotal ?? 0)}</span>
      </div>
      {(order.discountTotal ?? 0) > 0 && (
        <div className="flex justify-between text-[#2F855A]">
          <span>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ""}</span>
          <span>-{money(order.discountTotal!)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-[#6B7280]">Phí vận chuyển</span>
        <span>{money(order.shippingFee ?? 0)}</span>
      </div>
      {(order.taxTotal ?? 0) > 0 && (
        <div className="flex justify-between">
          <span className="text-[#6B7280]">VAT</span>
          <span>{money(order.taxTotal!)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-[#E5E7EB] pt-3 text-base font-bold">
        <span>Tổng cộng</span>
        <span>{money(order.grandTotal ?? 0)}</span>
      </div>
    </div>
  );
}
