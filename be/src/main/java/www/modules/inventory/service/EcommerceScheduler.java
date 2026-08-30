package www.modules.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import www.modules.notifications.service.NotificationSseHub;
import www.modules.orders.service.OrderService;
import www.modules.payments.service.EcommercePaymentService;

@Component
@RequiredArgsConstructor
@Slf4j
public class EcommerceScheduler {
    private final InventoryService inventoryService;
    private final EcommercePaymentService paymentService;
    private final NotificationSseHub notificationSseHub;
    private final OrderService orderService;
    private final www.modules.returns.service.ReturnService returnService;

    @Scheduled(cron = "0 */5 * * * *")
    public void expireCheckoutResources() {
        int reservations = inventoryService.expireReservations();
        int payments = paymentService.expirePendingPayments();
        if (reservations > 0 || payments > 0) {
            log.info("Expired {} stock reservations and {} pending payments", reservations, payments);
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    public void autoCompleteDeliveredOrders() {
        int completed = orderService.autoCompleteDeliveredOrders(7);
        if (completed > 0) {
            log.info("Auto-completed {} delivered orders", completed);
        }
        int expiredReturns = returnService.expireOverdueShipBackReturns();
        if (expiredReturns > 0) {
            log.info("Auto-rejected {} overdue return ship-back requests", expiredReturns);
        }
    }

    @Scheduled(cron = "0/30 * * * * *")
    public void keepAliveNotificationStreams() {
        notificationSseHub.pingAll();
    }
}
