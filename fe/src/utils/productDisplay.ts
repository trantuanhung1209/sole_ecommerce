import type { Inventory, Order, OrderItem, ReturnRequest } from "@/types/ecommerce.type";

export function formatVariantLabel(item: Pick<Inventory, "productName" | "size" | "colorName" | "sku">) {
  const parts = [item.productName, item.size, item.colorName].filter(Boolean);
  const label = parts.join(" · ");
  return item.sku ? `${label} (${item.sku})` : label || "Sản phẩm";
}

export function formatOrderItemNames(items: OrderItem[]) {
  return items.map((item) => item.productNameSnapshot).filter(Boolean).join(" · ");
}

export function resolveReturnProductName(item: ReturnRequest, ordersById: Record<string, Order>) {
  const order = ordersById[item.orderId];
  const orderItem = order?.items.find((entry) => entry.orderItemId === item.orderItemId);
  return orderItem?.productNameSnapshot ?? "Sản phẩm";
}

export function resolveOrderCode(orderId: string, ordersById: Record<string, Order>) {
  return ordersById[orderId]?.orderCode ?? "Đơn hàng";
}
