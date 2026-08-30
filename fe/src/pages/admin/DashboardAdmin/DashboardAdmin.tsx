import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Package, DollarSign, ShoppingCart, Activity, RotateCcw, AlertTriangle } from "lucide-react";
import {
  DashboardHeader,
  GrowthStatsCard,
  StatsCard,
  RevenueChart,
  OrderStatusChart,
  ProductPopularityChart,
} from "./components";
import { useDashboardData, useDashboardCharts, type TimeRange } from "./hooks";
import { exportDashboardToExcel, formatCurrency } from "./utils";

function DashboardAdmin() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  const { loading, stats, orders } = useDashboardData(timeRange);
  const { revenueChartData, orderStatusData, productPopularityData } =
    useDashboardCharts(orders, stats, timeRange);

  const handleExportExcel = () => {
    exportDashboardToExcel(stats, orders, revenueChartData, productPopularityData, timeRange);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onExportExcel={handleExportExcel}
      />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <GrowthStatsCard
            title="Tổng đơn hàng"
            value={stats.totalOrders}
            icon={ShoppingCart}
            growth={stats.orderGrowth}
          />
          <GrowthStatsCard
            title="Doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            growth={stats.revenueGrowth}
            bgColor="bg-green-500/5"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Người dùng"
            value={stats.totalUsers}
            icon={Users}
            description="Tổng số người dùng đã đăng ký"
            bgColor="bg-blue-500/5"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Sản phẩm"
            value={stats.totalProducts}
            icon={Package}
            description="Số sản phẩm trong catalog"
            bgColor="bg-purple-500/5"
            iconColor="text-purple-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart data={revenueChartData} formatCurrency={formatCurrency} />
          <OrderStatusChart data={orderStatusData} />
        </div>

        <ProductPopularityChart data={productPopularityData} formatCurrency={formatCurrency} />

        {(stats.overdueApprovedReturns > 0 || stats.staleRefundPendingReturns > 0) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Cảnh báo đổi/trả hàng
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {stats.overdueApprovedReturns > 0 ? (
                <li>{stats.overdueApprovedReturns} yêu cầu đã duyệt quá hạn gửi hàng trả</li>
              ) : null}
              {stats.staleRefundPendingReturns > 0 ? (
                <li>{stats.staleRefundPendingReturns} yêu cầu chờ hoàn tiền quá 3 ngày chưa xác nhận</li>
              ) : null}
            </ul>
            <Link to="/admin/returns" className="mt-2 inline-block text-sm font-medium underline">
              Mở quản lý trả hàng
            </Link>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Return chờ xử lý"
            value={stats.pendingReturns}
            icon={RotateCcw}
            description="Trạng thái PENDING"
            iconColor="text-orange-600"
          />
          <StatsCard
            title="Chờ chuyển tiền"
            value={stats.refundPendingReturns}
            icon={DollarSign}
            description="REFUND_PENDING"
            iconColor="text-amber-600"
          />
          <StatsCard
            title="Quá hạn gửi hàng"
            value={stats.overdueApprovedReturns}
            icon={AlertTriangle}
            description="APPROVED quá deadline"
            iconColor="text-red-600"
          />
          <StatsCard
            title="Hoàn tiền chậm"
            value={stats.staleRefundPendingReturns}
            icon={Activity}
            description="REFUND_PENDING > 3 ngày"
            iconColor="text-yellow-700"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Chờ thanh toán"
            value={stats.pendingOrders}
            icon={Activity}
            description="Cần xử lý ngay"
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Đã xác nhận"
            value={stats.confirmedOrders}
            icon={Package}
            description="Đơn đã thanh toán"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Hoàn thành"
            value={stats.completedOrders}
            icon={TrendingUp}
            description="Đã giao hàng"
            iconColor="text-green-600"
          />
          <StatsCard
            title="TB giá trị đơn"
            value={formatCurrency(stats.averageOrderValue)}
            icon={DollarSign}
            description="Doanh thu trung bình"
            iconColor="text-primary"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
