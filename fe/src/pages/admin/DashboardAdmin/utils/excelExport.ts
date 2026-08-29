import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import type { Order } from "@/types/ecommerce.type";
import type { DashboardStats, TimeRange } from "../hooks/useDashboardData";
import type { RevenueData, ProductPopularityData } from "../hooks/useDashboardCharts";
import { getOrderStatusLabel } from "@/utils/displayLabels";

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const getTimeRangeLabel = (range: TimeRange): string => {
  const labels: Record<TimeRange, string> = {
    "7days": "7 ngày qua",
    "30days": "30 ngày qua",
    "90days": "90 ngày qua",
    year: "1 năm qua",
    all: "Toàn bộ thời gian",
  };
  return labels[range];
};

export function exportDashboardToExcel(
  stats: DashboardStats,
  orders: Order[],
  revenueChartData: RevenueData[],
  productPopularityData: ProductPopularityData[],
  timeRange: TimeRange
) {
  try {
    const overviewData = [
      ["BÁO CÁO THỐNG KÊ TỔNG QUAN - SOLE E-COMMERCE"],
      ["Thời gian: " + new Date().toLocaleString("vi-VN")],
      ["Khoảng thời gian: " + getTimeRangeLabel(timeRange)],
      [],
      ["CHỈ SỐ TỔNG QUAN"],
      ["Tổng số đơn hàng", stats.totalOrders],
      ["Doanh thu", formatCurrency(stats.totalRevenue)],
      ["Giá trị đơn trung bình", formatCurrency(stats.averageOrderValue)],
      ["Tăng trưởng doanh thu (%)", stats.revenueGrowth.toFixed(2) + "%"],
      ["Tăng trưởng đơn hàng (%)", stats.orderGrowth.toFixed(2) + "%"],
      ["Tổng số người dùng", stats.totalUsers],
      ["Tổng số sản phẩm", stats.totalProducts],
      [],
      ["TRẠNG THÁI ĐƠN HÀNG"],
      ["Chờ thanh toán", stats.pendingOrders],
      ["Đã xác nhận", stats.confirmedOrders],
      ["Hoàn thành", stats.completedOrders],
      ["Đã hủy", stats.cancelledOrders],
    ];

    const revenueData = [
      [],
      ["DOANH THU THEO THỜI GIAN"],
      ["Thời gian", "Doanh thu (VND)", "Số lượng đơn"],
      ...revenueChartData.map((item) => [item.month, item.revenue, item.orders]),
    ];

    const productData = [
      [],
      ["SẢN PHẨM BÁN CHẠY"],
      ["Tên sản phẩm", "Số lượng", "Doanh thu (VND)"],
      ...productPopularityData.map((item) => [item.productName, item.orders, item.revenue]),
    ];

    const orderData = [
      [],
      ["CHI TIẾT ĐƠN HÀNG"],
      ["Mã đơn", "Tổng tiền (VND)", "Trạng thái", "Ngày tạo"],
      ...orders.map((order) => [
        order.orderCode,
        order.grandTotal,
        getOrderStatusLabel(order.status),
        new Date(order.createdAt).toLocaleString("vi-VN"),
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([...overviewData, ...revenueData, ...productData]);
    ws1["!cols"] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Tổng quan");

    const ws2 = XLSX.utils.aoa_to_sheet(orderData);
    ws2["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết đơn hàng");

    const fileName = `BaoCao_ThongKe_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName, { bookType: "xlsx", type: "binary", cellStyles: true });
    toast.success("Xuất báo cáo Excel thành công!");
  } catch (error) {
    console.error("Error exporting Excel:", error);
    toast.error("Không thể xuất báo cáo Excel");
  }
}
