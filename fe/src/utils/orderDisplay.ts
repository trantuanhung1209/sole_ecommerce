import type { Address, Order, OrderItem } from "@/types/ecommerce.type";

export const ORDER_ITEM_PLACEHOLDER =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80";

export function orderItemImage(item: Pick<OrderItem, "imageSnapshot">) {
  return item.imageSnapshot || ORDER_ITEM_PLACEHOLDER;
}

export function parseShippingAddress(snapshot?: string): Address | null {
  if (!snapshot?.trim()) return null;
  try {
    return JSON.parse(snapshot) as Address;
  } catch {
    return null;
  }
}

export function formatShippingAddress(snapshot?: string): string {
  const parsed = parseShippingAddress(snapshot);
  if (!parsed) {
    return snapshot?.trim() || "—";
  }
  const location = [parsed.line1, parsed.ward, parsed.district, parsed.city].filter(Boolean).join(", ");
  return `${parsed.recipientName} · ${parsed.phone}${location ? ` · ${location}` : ""}`;
}

export function formatOrderItemMeta(item: OrderItem) {
  return [item.sizeSnapshot, item.colorSnapshot].filter(Boolean).join(" / ");
}

export function orderItemCount(order: Pick<Order, "items">) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
  CANCELLED: "Đã hủy",
};

export function getPaymentStatusLabel(status?: string) {
  if (!status) return "—";
  return PAYMENT_STATUS_LABELS[status] ?? status;
}
