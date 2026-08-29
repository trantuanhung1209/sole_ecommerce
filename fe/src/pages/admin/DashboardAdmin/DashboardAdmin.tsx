import { useState } from "react";
import { TrendingUp, Users, Package, DollarSign, ShoppingCart, Activity } from "lucide-react";
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
