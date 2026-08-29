import { useMemo } from "react";
import type { Order } from "@/types/ecommerce.type";
import type { DashboardStats, TimeRange } from "./useDashboardData";

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface ProductPopularityData {
  productName: string;
  orders: number;
  revenue: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "#eab308",
  PAID: "#06b6d4",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#6366f1",
  DELIVERED: "#22c55e",
  COMPLETED: "#16a34a",
  CANCELLED: "#ef4444",
};

export function useDashboardCharts(orders: Order[], stats: DashboardStats, timeRange: TimeRange) {
  const revenueChartData = useMemo<RevenueData[]>(() => {
    const dataMap: Record<string, { revenue: number; orders: number }> = {};

    orders.forEach((order) => {
      if (["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status)) {
        const date = new Date(order.createdAt);
        const monthKey =
          timeRange === "7days"
            ? `${date.getDate()}/${date.getMonth() + 1}`
            : `${date.getMonth() + 1}/${date.getFullYear()}`;

        const existing = dataMap[monthKey] || { revenue: 0, orders: 0 };
        dataMap[monthKey] = {
          revenue: existing.revenue + order.grandTotal,
          orders: existing.orders + 1,
        };
      }
    });

    return Object.entries(dataMap)
      .map(([month, data]) => ({ month, revenue: data.revenue, orders: data.orders }))
      .sort((a, b) => {
        const [aDay, aMonth] = a.month.split("/").map(Number);
        const [bDay, bMonth] = b.month.split("/").map(Number);
        return timeRange === "7days" ? aDay - bDay : aMonth - bMonth;
      });
  }, [orders, timeRange]);

  const orderStatusData = useMemo<OrderStatusData[]>(() => {
    return [
      { name: "Chờ thanh toán", value: stats.pendingOrders, color: STATUS_COLORS.PENDING_PAYMENT },
      { name: "Đã xác nhận", value: stats.confirmedOrders, color: STATUS_COLORS.CONFIRMED },
      { name: "Hoàn thành", value: stats.completedOrders, color: STATUS_COLORS.COMPLETED },
      { name: "Đã hủy", value: stats.cancelledOrders, color: STATUS_COLORS.CANCELLED },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const productPopularityData = useMemo<ProductPopularityData[]>(() => {
    const productMap: Record<string, { orders: number; revenue: number }> = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.productNameSnapshot || "Unknown Product";
        const existing = productMap[name] || { orders: 0, revenue: 0 };
        productMap[name] = {
          orders: existing.orders + item.quantity,
          revenue: existing.revenue + item.lineTotal,
        };
      });
    });

    return Object.entries(productMap)
      .map(([productName, data]) => ({
        productName: productName.length > 24 ? `${productName.substring(0, 24)}...` : productName,
        orders: data.orders,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [orders]);

  return { revenueChartData, orderStatusData, productPopularityData };
}
