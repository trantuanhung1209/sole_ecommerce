import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money } from "@/services/ecommerceServices";
import type { Order } from "@/types/ecommerce.type";
import { getPaymentStatusLabel, orderItemCount, orderItemImage } from "@/utils/orderDisplay";

type OrderHistoryCardProps = {
  order: Order;
  detailPath?: string;
};

export function OrderHistoryCard({ order, detailPath }: OrderHistoryCardProps) {
  const href = detailPath ?? `/orders/${order.orderId}`;
  const previewItems = order.items.slice(0, 3);
  const extraCount = Math.max(0, order.items.length - previewItems.length);
  const itemTotal = orderItemCount(order);

  return (
    <Link
      to={href}
      className="group block rounded-2xl border border-[#E5E7EB] bg-white p-4 transition hover:border-[#E53935]/30 hover:shadow-md sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex shrink-0 items-center -space-x-2">
            {previewItems.map((item) => (
              <div
                key={item.orderItemId}
                className="h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-[#F1F1EF] shadow-sm"
              >
                <img
                  src={orderItemImage(item)}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              </div>
            ))}
            {extraCount > 0 ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-[#111111] text-xs font-bold text-white shadow-sm">
                +{extraCount}
              </div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold">{order.orderCode}</p>
              <StatusBadge kind="order" status={order.status} />
            </div>
            <p className="mt-1 text-sm text-[#6B7280]">
              {new Date(order.createdAt).toLocaleString("vi-VN")} · {itemTotal} sản phẩm
            </p>
            <p className="mt-1 line-clamp-1 text-sm">
              {order.items.map((item) => item.productNameSnapshot).join(", ")}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Thanh toán: {getPaymentStatusLabel(order.paymentStatus)}
              {order.trackingCode ? ` · Vận đơn ${order.trackingCode}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-lg font-black">{money(order.grandTotal)}</p>
          <span className="inline-flex items-center text-sm font-semibold text-[#E53935] opacity-0 transition group-hover:opacity-100">
            Chi tiết
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
