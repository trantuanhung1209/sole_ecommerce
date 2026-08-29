import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { orderApi, reportApi } from "@/services/ecommerceServices";
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

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(timeRange);
      const periodMs = endDate.getTime() - startDate.getTime();
      const prevEnd = new Date(startDate.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - periodMs);

      const from = formatDate(startDate);
      const to = formatDate(endDate);
      const prevFrom = formatDate(prevStart);
      const prevTo = formatDate(prevEnd);

      const [report, prevReport, ordersPage] = await Promise.all([
        reportApi.dashboard(from, to),
        reportApi.dashboard(prevFrom, prevTo),
        orderApi.adminList(undefined, 0, 500),
      ]);

      const ordersData = filterOrders(ordersPage.content, startDate, endDate);
      const revenueGrowth =
        prevReport.totalRevenue > 0
          ? ((report.totalRevenue - prevReport.totalRevenue) / prevReport.totalRevenue) * 100
          : 0;
      const orderGrowth =
        prevReport.totalOrders > 0
          ? ((report.totalOrders - prevReport.totalOrders) / prevReport.totalOrders) * 100
          : 0;

      setOrders(ordersData);
      setStats({
        totalOrders: report.totalOrders,
        totalRevenue: report.totalRevenue,
        totalUsers: report.totalUsers,
        totalProducts: report.totalProducts,
        pendingOrders: report.pendingOrders,
        confirmedOrders: report.paidOrders,
        cancelledOrders: ordersData.filter((o) => o.status === "CANCELLED").length,
        completedOrders: report.completedOrders,
        averageOrderValue: report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0,
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
