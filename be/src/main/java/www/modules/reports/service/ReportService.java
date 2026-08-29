package www.modules.reports.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.modules.catalog.repository.ProductRepository;
import www.modules.common.EcommerceEnums.EcommercePaymentStatus;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.inventory.repository.InventoryRepository;
import www.modules.orders.repository.OrderRepository;
import www.modules.reports.dto.ReportDtos.DashboardReport;
import www.modules.returns.repository.ReturnRequestRepository;
import www.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ReturnRequestRepository returnRepository;
    private final UserRepository userRepository;

    public DashboardReport dashboard() {
        return dashboard(null, null);
    }

    public DashboardReport dashboard(LocalDate from, LocalDate to) {
        List<www.modules.orders.model.Order> orders = orderRepository.findAll().stream()
                .filter(o -> withinRange(o.getCreatedAt(), from, to))
                .toList();
        double revenue = orders.stream()
                .filter(o -> o.getPaymentStatus() == EcommercePaymentStatus.COMPLETED)
                .mapToDouble(o -> o.getGrandTotal() != null ? o.getGrandTotal() : 0)
                .sum();

        return DashboardReport.builder()
                .totalOrders(orders.size())
                .pendingOrders(orders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING_PAYMENT).count())
                .paidOrders(orders.stream().filter(o -> o.getPaymentStatus() == EcommercePaymentStatus.COMPLETED).count())
                .completedOrders(orders.stream().filter(o -> o.getStatus() == OrderStatus.COMPLETED).count())
                .totalRevenue(revenue)
                .totalProducts(productRepository.count())
                .publishedProducts(productRepository.countByStatusAndPublicStatusAndDeletedFalse(
                        ProductStatus.PUBLISHED, PublicStatus.PUBLISHED))
                .lowStockVariants(inventoryRepository.countByAvailableLessThanEqual(LOW_STOCK_THRESHOLD))
                .pendingReturns(returnRepository.countByStatus(ReturnStatus.PENDING))
                .totalUsers(userRepository.count())
                .build();
    }

    private boolean withinRange(LocalDateTime createdAt, LocalDate from, LocalDate to) {
        if (createdAt == null) {
            return true;
        }
        if (from != null && createdAt.toLocalDate().isBefore(from)) {
            return false;
        }
        if (to != null && createdAt.toLocalDate().isAfter(to)) {
            return false;
        }
        return true;
    }
}
