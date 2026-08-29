import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { productApi, orderApi } from "@/services/ecommerceServices";
import { userServices } from "@/services/userServices";
import type { Order } from "@/types/ecommerce.type";

export type TimeRange = "7days" | "30days" | "90days" | "year" | "all";

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export function useDashboardData(timeRange: TimeRange) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    cancelledOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const getDateRange = (range: TimeRange): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();

    switch (range) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "all":
        startDate.setFullYear(2020, 0, 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  };

  const filterOrders = (items: Order[], start: Date, end: Date) =>
    items.filter((order) => {
      const created = new Date(order.createdAt);
      return created >= start && created <= end;
    });

  const calcRevenue = (items: Order[]) =>
    items
      .filter((o) => ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(o.status))
      .reduce((sum, o) => sum + o.grandTotal, 0);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(timeRange);
      const periodMs = endDate.getTime() - startDate.getTime();
      const prevEnd = new Date(startDate.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - periodMs);

      const [ordersPage, productsPage, usersPage] = await Promise.all([
        orderApi.adminList(undefined, 0, 500),
        productApi.list({ page: 0, pageSize: 1 }),
        userServices.getAllUsersPaginated({ page: 0, size: 1 }),
      ]);
      const ordersData = ordersPage.content;

      const filteredOrders = filterOrders(ordersData, startDate, endDate);
      const previousOrders = filterOrders(ordersData, prevStart, prevEnd);
      const totalRevenue = calcRevenue(filteredOrders);
      const previousRevenue = calcRevenue(previousOrders);

      const revenueGrowth =
        previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const orderGrowth =
        previousOrders.length > 0
          ? ((filteredOrders.length - previousOrders.length) / previousOrders.length) * 100
          : 0;

      setOrders(filteredOrders);
      setStats({
        totalOrders: filteredOrders.length,
        totalRevenue,
        totalUsers: usersPage.totalElements,
        totalProducts: productsPage.totalElements,
        pendingOrders: filteredOrders.filter((o) => o.status === "PENDING_PAYMENT").length,
        confirmedOrders: filteredOrders.filter((o) => ["CONFIRMED", "PAID"].includes(o.status)).length,
        cancelledOrders: filteredOrders.filter((o) => o.status === "CANCELLED").length,
        completedOrders: filteredOrders.filter((o) => ["DELIVERED", "COMPLETED"].includes(o.status)).length,
        averageOrderValue:
          filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
        revenueGrowth,
        orderGrowth,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  return { loading, stats, orders };
}
