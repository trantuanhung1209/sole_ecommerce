package www.modules.reports.dto;

import lombok.Builder;
import lombok.Data;

public final class ReportDtos {
    private ReportDtos() {}

    @Data
    @Builder
    public static class DashboardReport {
        private long totalOrders;
        private long pendingOrders;
        private long paidOrders;
        private long completedOrders;
        private double totalRevenue;
        private long totalProducts;
        private long publishedProducts;
        private long lowStockVariants;
        private long pendingReturns;
        private long totalUsers;
    }
}
