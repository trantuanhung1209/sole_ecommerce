package www.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import www.model.entity.User;
import www.model.enums.UserRole;
import www.modules.addresses.model.Address;
import www.modules.addresses.repository.AddressRepository;
import www.modules.ai.model.AiConversation;
import www.modules.ai.repository.AiConversationRepository;
import www.modules.cart.repository.CartRepository;
import www.modules.catalog.model.Brand;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.BrandRepository;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.*;
import www.modules.inventory.model.StockReservation;
import www.modules.inventory.repository.InventoryRepository;
import www.modules.inventory.repository.StockReservationRepository;
import www.modules.notifications.model.Notification;
import www.modules.notifications.repository.NotificationRepository;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.repository.OrderRepository;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.repository.EcommercePaymentRepository;
import www.modules.payments.repository.PaymentEventRepository;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.model.CouponUsage;
import www.modules.promotions.repository.CouponRepository;
import www.modules.promotions.repository.CouponUsageRepository;
import www.modules.rbac.model.AuditLog;
import www.modules.rbac.repository.AuditLogRepository;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.repository.ReturnRequestRepository;
import www.modules.wishlist.model.WishlistItem;
import www.modules.wishlist.repository.WishlistRepository;
import www.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static www.config.DemoOperationsSeedSupport.*;

/**
 * Seeds diverse, idempotent demo data across operational collections
 * (addresses, coupons, orders, payments, reservations, returns, wishlists,
 * notifications, AI conversations, audit logs, and low/out-of-stock inventory).
 */
@Service
@DependsOn({"catalogSeedService", "userSeedService", "rbacService"})
@RequiredArgsConstructor
@Slf4j
public class DemoOperationsSeedService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final BrandRepository brandRepository;
    private final InventoryRepository inventoryRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final EcommercePaymentRepository paymentRepository;
    private final PaymentEventRepository paymentEventRepository;
    private final StockReservationRepository reservationRepository;
    private final ReturnRequestRepository returnRepository;
    private final WishlistRepository wishlistRepository;
    private final NotificationRepository notificationRepository;
    private final AiConversationRepository aiConversationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Value("${demo.ops.seed.enabled:true}")
    private boolean seedEnabled;

    @PostConstruct
    public void seedDemoOperationsIfEmpty() {
        if (!seedEnabled) {
            log.info("Demo operations seed disabled");
            return;
        }
        try {
            User c1 = userRepository.findByEmail("customer@sole.test").orElse(null);
            User c2 = userRepository.findByEmail("customer2@sole.test").orElse(null);
            User c3 = userRepository.findByEmail("customer3@sole.test").orElse(null);
            User c4 = userRepository.findByEmail("customer4@sole.test").orElse(null);
            if (c1 == null) {
                log.info("Demo ops seed skipped — demo customer account not ready");
                return;
            }
            List<Product> products = productRepository.findAll();
            List<ProductVariant> variants = variantRepository.findAll();
            if (products.isEmpty() || variants.isEmpty()) {
                log.info("Demo ops seed skipped — catalog not ready");
                return;
            }

            LocalDateTime now = LocalDateTime.now();
            User staff = userRepository.findByEmail("staff@sole.test").orElse(null);
            User manager = userRepository.findByEmail("manager@sole.test").orElse(null);
            User superAdmin = userRepository.findByEmail("superadmin@sole.test").orElse(null);
            List<User> staffUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole() != UserRole.CUSTOMER)
                    .toList();

            List<Address> addresses = upsertMissingAddresses(c1, c2, c3, c4, now);
            List<Coupon> coupons = upsertMissingCoupons(now);
            seedCustomerCartIfAbsent(c1, variants, now);
            List<Order> orders = upsertMissingOrdersAndPayments(
                    c1, c2, c3, c4, addresses, coupons, products, variants, now);
            Map<String, Order> orderByCode = orders.stream()
                    .filter(o -> o.getOrderCode() != null)
                    .collect(Collectors.toMap(Order::getOrderCode, Function.identity(), (a, b) -> a));
            upsertMissingReturns(orderByCode, manager, products, now);
            upsertMissingWishlists(c1, c2, c3, products, now);
            upsertMissingNotifications(c1, c2, c3, staffUsers, orderByCode, now);
            upsertMissingAiConversations(c1, c2, c3, now);
            upsertMissingAuditLogs(superAdmin, manager, staff, now);
        } catch (DataAccessException e) {
            log.warn("Skip demo ops seed because database is not ready: {}", e.getMessage());
        }
    }

    private List<Address> upsertMissingAddresses(User c1, User c2, User c3, User c4, LocalDateTime now) {
        List<Address> existing = addressRepository.findAll();
        Set<String> keys = existing.stream()
                .map(DemoOperationsSeedService::addressKey)
                .collect(Collectors.toCollection(HashSet::new));
        List<Address> missing = buildAddresses(c1, c2, c3, c4, now).stream()
                .filter(addr -> keys.add(addressKey(addr)))
                .toList();
        if (missing.isEmpty()) {
            return existing;
        }
        List<Address> saved = addressRepository.saveAll(missing);
        log.info("Demo ops seed: created {} missing address(es)", saved.size());
        List<Address> all = new ArrayList<>(existing);
        all.addAll(saved);
        return all;
    }

    private List<Coupon> upsertMissingCoupons(LocalDateTime now) {
        List<Coupon> existing = couponRepository.findAll();
        Set<String> codes = existing.stream()
                .filter(c -> c.getCode() != null)
                .map(c -> c.getCode().toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(HashSet::new));
        List<Coupon> missing = buildCoupons(now).stream()
                .filter(c -> c.getCode() != null && codes.add(c.getCode().toUpperCase(Locale.ROOT)))
                .toList();
        if (missing.isEmpty()) {
            return existing;
        }
        List<Coupon> saved = couponRepository.saveAll(missing);
        log.info("Demo ops seed: created {} missing coupon(s)", saved.size());
        List<Coupon> all = new ArrayList<>(existing);
        all.addAll(saved);
        return all;
    }

    private void seedCustomerCartIfAbsent(User c1, List<ProductVariant> variants, LocalDateTime now) {
        if (cartRepository.findFirstByUserIdAndStatus(c1.getUserId(), CartStatus.ACTIVE).isPresent()) {
            return;
        }
        cartRepository.save(buildCustomerCart(c1.getUserId(), variants, now));
        log.info("Demo ops seed: created active demo cart for {}", c1.getEmail());
    }

    private List<Order> upsertMissingOrdersAndPayments(
            User c1, User c2, User c3, User c4,
            List<Address> addresses, List<Coupon> coupons,
            List<Product> products, List<ProductVariant> variants, LocalDateTime now
    ) {
        List<Order> existing = orderRepository.findAll();
        Set<String> existingCodes = existing.stream()
                .map(Order::getOrderCode)
                .filter(code -> code != null && !code.isBlank())
                .collect(Collectors.toCollection(HashSet::new));

        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getProductId, Function.identity(), (a, b) -> a));
        Map<String, Brand> brandMap = brandRepository.findAll().stream()
                .collect(Collectors.toMap(Brand::getBrandId, Function.identity(), (a, b) -> a));

        Map<String, Address> defaultAddressByUser = new HashMap<>();
        for (Address addr : addresses) {
            defaultAddressByUser.putIfAbsent(addr.getUserId(), addr);
        }

        String addr1 = serializeAddress(objectMapper, defaultAddressByUser.get(c1.getUserId()));
        String c2Id = c2 != null ? c2.getUserId() : c1.getUserId();
        String c3Id = c3 != null ? c3.getUserId() : c2Id;
        String c4Id = c4 != null ? c4.getUserId() : c2Id;
        String addr2 = serializeAddress(objectMapper, defaultAddressByUser.getOrDefault(c2Id, defaultAddressByUser.get(c1.getUserId())));
        String addr3 = serializeAddress(objectMapper, defaultAddressByUser.getOrDefault(c3Id, defaultAddressByUser.get(c1.getUserId())));
        String addr4 = serializeAddress(objectMapper, defaultAddressByUser.getOrDefault(c4Id, defaultAddressByUser.get(c1.getUserId())));

        List<Order> specs = buildOrderSpecs(
                c1.getUserId(), c2Id, c3Id, c4Id,
                addr1, addr2, addr3, addr4,
                variants, productMap, brandMap, now);
        List<Order> missing = specs.stream()
                .filter(o -> !existingCodes.contains(o.getOrderCode()))
                .toList();

        if (missing.isEmpty()) {
            return existing;
        }

        List<Order> savedNewOrders = orderRepository.saveAll(missing);
        seedOrderArtifacts(savedNewOrders, coupons, variants, now, existing.isEmpty());
        log.info("Demo ops seed: created {} missing order(s) with payments & reservations", savedNewOrders.size());

        List<Order> all = new ArrayList<>(existing);
        all.addAll(savedNewOrders);
        return all;
    }

    private List<Order> buildOrderSpecs(
            String c1Id, String c2Id, String c3Id, String c4Id,
            String addr1, String addr2, String addr3, String addr4,
            List<ProductVariant> variants, Map<String, Product> productMap, Map<String, Brand> brandMap, LocalDateTime now
    ) {
        OrderItem i0 = itemAt(variants, productMap, brandMap, 0, 1, false, null);
        OrderItem i1 = itemAt(variants, productMap, brandMap, 1, 1, false, null);
        OrderItem i2 = itemAt(variants, productMap, brandMap, 2, 2, false, null);
        OrderItem i3 = itemAt(variants, productMap, brandMap, 3, 1, false, null);
        OrderItem i4 = itemAt(variants, productMap, brandMap, 4, 1, false, null);
        OrderItem i5 = itemAt(variants, productMap, brandMap, 5, 1, true, null);
        OrderItem i6 = itemAt(variants, productMap, brandMap, 6, 1, true, null);
        OrderItem i7 = itemAt(variants, productMap, brandMap, 7, 1, false, null);
        OrderItem i8 = itemAt(variants, productMap, brandMap, 8, 1, false, "PENDING");
        OrderItem i9 = itemAt(variants, productMap, brandMap, 9, 1, false, "REFUNDED");
        OrderItem i10 = itemAt(variants, productMap, brandMap, 10, 1, false, "STAFF_CONFIRMED");
        OrderItem i11 = itemAt(variants, productMap, brandMap, 11, 1, false, "APPROVED");
        OrderItem i12 = itemAt(variants, productMap, brandMap, 12, 1, false, "RECEIVED");
        OrderItem i13 = itemAt(variants, productMap, brandMap, 13, 1, false, "REFUND_PENDING");
        OrderItem i14 = itemAt(variants, productMap, brandMap, 14, 1, false, "REJECTED");
        OrderItem i15 = itemAt(variants, productMap, brandMap, 15, 1, false, "PENDING");
        OrderItem i16 = itemAt(variants, productMap, brandMap, 16, 1, true, "APPROVED");
        OrderItem i17 = itemAt(variants, productMap, brandMap, 17, 1, false, null);
        OrderItem i18 = itemAt(variants, productMap, brandMap, 18, 1, false, null);
        OrderItem i19 = itemAt(variants, productMap, brandMap, 19, 1, false, null);

        return List.of(
                buildOrder(SEED_ORDER_PREFIX + "001", c1Id, addr1, List.of(i0), OrderStatus.PENDING_PAYMENT, EcommercePaymentStatus.PENDING, FulfillmentStatus.UNFULFILLED, 0, 30000, null, "Giao giờ hành chính", null, null, now.minusMinutes(25), null, null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "002", c2Id, addr2, List.of(i1), OrderStatus.PAID, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.UNFULFILLED, 150000, 0, "SOLE150K", "Gọi trước khi giao", null, null, now.minusHours(8), now.minusHours(8), null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "003", c1Id, addr1, List.of(i2), OrderStatus.CONFIRMED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.PROCESSING, 200000, 0, "SOLE10", null, null, null, now.minusHours(18), now.minusHours(17), null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "004", c2Id, addr2, List.of(i3), OrderStatus.PROCESSING, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.PROCESSING, 0, 0, "FREESHIP", "Đóng gói kỹ hộp giày", null, "VNPOST-881204", now.minusDays(1), now.minusDays(1), null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "005", c1Id, addr1, List.of(i4), OrderStatus.SHIPPED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.SHIPPED, 0, 0, null, null, null, "GHN-SOLE-99210", now.minusDays(2), now.minusDays(2), null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "006", c1Id, addr1, List.of(i5), OrderStatus.DELIVERED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 150000, 0, "SOLE10", null, null, "GHN-SOLE-99180", now.minusDays(3), now.minusDays(3), now.minusDays(1), null, null),
                buildOrder(SEED_ORDER_PREFIX + "007", c1Id, addr1, List.of(i6), OrderStatus.COMPLETED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHTK-SOLE-77102", now.minusDays(14), now.minusDays(14), now.minusDays(11), now.minusDays(4), null),
                buildOrder(SEED_ORDER_PREFIX + "008", c2Id, addr2, List.of(i7), OrderStatus.CANCELLED, EcommercePaymentStatus.CANCELLED, FulfillmentStatus.UNFULFILLED, 0, 30000, null, null, "Khách đổi ý chọn mẫu khác", null, now.minusDays(5), null, null, null, now.minusDays(5)),
                buildOrder(SEED_ORDER_PREFIX + "009", c1Id, addr1, List.of(i8), OrderStatus.RETURN_REQUESTED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHN-SOLE-66101", now.minusDays(4), now.minusDays(4), now.minusDays(1), null, null),
                buildOrder(SEED_ORDER_PREFIX + "010", c1Id, addr1, List.of(i9), OrderStatus.REFUNDED, EcommercePaymentStatus.REFUNDED, FulfillmentStatus.RETURNED, 0, 0, null, null, null, "GHN-SOLE-55100", now.minusDays(9), now.minusDays(9), now.minusDays(7), null, null),
                buildOrder(SEED_ORDER_PREFIX + "011", c2Id, addr2, List.of(i10), OrderStatus.RETURN_REQUESTED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHTK-SOLE-55200", now.minusDays(6), now.minusDays(6), now.minusDays(3), null, null),
                buildOrder(SEED_ORDER_PREFIX + "012", c1Id, addr1, List.of(i11), OrderStatus.RETURN_REQUESTED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHTK-SOLE-55300", now.minusDays(6), now.minusDays(6), now.minusDays(3), null, null),
                buildOrder(SEED_ORDER_PREFIX + "013", c2Id, addr2, List.of(i12), OrderStatus.RETURN_REQUESTED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHN-SOLE-55400", now.minusDays(8), now.minusDays(8), now.minusDays(5), null, null),
                buildOrder(SEED_ORDER_PREFIX + "014", c1Id, addr1, List.of(i13), OrderStatus.RETURN_REQUESTED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHN-SOLE-55500", now.minusDays(10), now.minusDays(10), now.minusDays(8), null, null),
                buildOrder(SEED_ORDER_PREFIX + "015", c2Id, addr2, List.of(i14), OrderStatus.DELIVERED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 0, 0, null, null, null, "GHN-SOLE-55600", now.minusDays(7), now.minusDays(7), now.minusDays(4), null, null),
                buildOrder(SEED_ORDER_PREFIX + "016", c1Id, addr1, List.of(i15), OrderStatus.DELIVERED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 100000, 0, "NEWMEMBER", "Kiểm tra size kỹ trước khi gửi", null, "GHN-SOLE-55700", now.minusDays(5), now.minusDays(5), now.minusDays(2), null, null),
                buildOrder(SEED_ORDER_PREFIX + "017", c1Id, addr1, List.of(i16), OrderStatus.COMPLETED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.DELIVERED, 200000, 0, "WEEKEND200K", null, null, "GHTK-SOLE-55800", now.minusDays(16), now.minusDays(16), now.minusDays(12), now.minusDays(5), null),
                buildOrder(SEED_ORDER_PREFIX + "018", c1Id, addr1, List.of(i17), OrderStatus.PROCESSING, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.PROCESSING, 0, 0, "FREESHIP_PRO", "Giao buổi tối sau 18h", null, "GHN-SOLE-55900", now.minusHours(4), now.minusHours(4), null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "019", c3Id, addr3, List.of(i18), OrderStatus.SHIPPED, EcommercePaymentStatus.COMPLETED, FulfillmentStatus.SHIPPED, 100000, 0, "NEWMEMBER", null, null, "VNPOST-99312", now.minusDays(1), now.minusDays(1), null, null, null),
                buildOrder(SEED_ORDER_PREFIX + "020", c4Id, addr4, List.of(i19), OrderStatus.CANCELLED, EcommercePaymentStatus.CANCELLED, FulfillmentStatus.UNFULFILLED, 0, 30000, null, null, "Đổi sang mẫu khác phù hợp chạy trail", null, now.minusDays(3), null, null, null, now.minusDays(3))
        );
    }

    private OrderItem itemAt(
            List<ProductVariant> variants, Map<String, Product> productMap, Map<String, Brand> brandMap,
            int index, int qty, boolean reviewed, String returnStatus
    ) {
        ProductVariant variant = variants.get(index % variants.size());
        Product product = productMap.get(variant.getProductId());
        return toOrderItem(variant, product, brandMap, qty, reviewed, returnStatus);
    }

    private void seedOrderArtifacts(
            List<Order> orders, List<Coupon> coupons, List<ProductVariant> variants,
            LocalDateTime now, boolean isInitialOrderSeed
    ) {
        Map<String, Coupon> couponMap = coupons.stream()
                .filter(c -> c.getCode() != null)
                .collect(Collectors.toMap(c -> c.getCode().toUpperCase(Locale.ROOT), Function.identity(), (a, b) -> a));
        List<EcommercePayment> payments = new ArrayList<>();
        List<StockReservation> reservations = new ArrayList<>();
        List<CouponUsage> usages = new ArrayList<>();
        boolean seededPendingOrder = false;

        for (Order order : orders) {
            if ((SEED_ORDER_PREFIX + "001").equals(order.getOrderCode())) {
                seededPendingOrder = true;
            }
            if (paymentRepository.findByOrderInvoiceNumber("ORDER_" + order.getOrderCode()).isEmpty()) {
                payments.add(buildPayment(order, now));
            }
            if (reservationRepository.findByOrderId(order.getOrderId()).isEmpty()) {
                ReservationStatus rStatus = switch (order.getStatus()) {
                    case PENDING_PAYMENT -> ReservationStatus.ACTIVE;
                    case CANCELLED -> ReservationStatus.RELEASED;
                    default -> ReservationStatus.CONFIRMED;
                };
                LocalDateTime expiresAt = rStatus == ReservationStatus.ACTIVE
                        ? now.plusDays(7)
                        : order.getCreatedAt().plusMinutes(15);
                for (OrderItem item : order.getItems()) {
                    reservations.add(buildReservation(order, item, rStatus, expiresAt));
                }
            }
            if (order.getCouponCode() != null && order.getDiscountTotal() > 0) {
                Coupon coupon = couponMap.get(order.getCouponCode().toUpperCase(Locale.ROOT));
                if (coupon != null) {
                    usages.add(buildCouponUsage(coupon, order));
                }
            }
        }

        if (!payments.isEmpty()) {
            List<EcommercePayment> savedPayments = paymentRepository.saveAll(payments);
            savedPayments.stream()
                    .filter(p -> p.getTransactionId() != null)
                    .filter(p -> paymentEventRepository.findByGatewayAndTransactionId("SEPAY", p.getTransactionId()).isEmpty())
                    .map(DemoOperationsSeedSupport::buildPaymentEvent)
                    .forEach(paymentEventRepository::save);
        }
        if (!reservations.isEmpty()) {
            reservationRepository.saveAll(reservations);
        }
        if (!usages.isEmpty()) {
            couponUsageRepository.saveAll(usages);
        }
        // Keep PENDING_PAYMENT order reservation consistent on variant[0] inventory when 001 is newly created
        if (seededPendingOrder && !variants.isEmpty()) {
            inventoryRepository.findByVariantIdAndWarehouseId(variants.get(0).getVariantId(), "default").ifPresent(inv -> {
                if (inv.getAvailable() > 0) {
                    inv.setReserved(inv.getReserved() + 1);
                    inv.setAvailable(inv.getAvailable() - 1);
                    inv.setUpdatedAt(now);
                    inventoryRepository.save(inv);
                }
            });
        }
        if (isInitialOrderSeed) {
            seedLowAndOutOfStockSamples(variants, now);
        }
    }

    private void seedLowAndOutOfStockSamples(List<ProductVariant> variants, LocalDateTime now) {
        if (variants.size() < 4) {
            return;
        }
        String lowVariantId = variants.get(variants.size() - 2).getVariantId();
        String outVariantId = variants.get(variants.size() - 1).getVariantId();
        inventoryRepository.findByVariantIdAndWarehouseId(lowVariantId, "default").ifPresent(inv -> {
            inv.setOnHand(inv.getReserved() + inv.getSold() + 3);
            inv.setAvailable(3);
            inv.setUpdatedAt(now);
            inventoryRepository.save(inv);
        });
        inventoryRepository.findByVariantIdAndWarehouseId(outVariantId, "default").ifPresent(inv -> {
            inv.setOnHand(inv.getReserved() + inv.getSold());
            inv.setAvailable(0);
            inv.setUpdatedAt(now);
            inventoryRepository.save(inv);
        });
    }

    private void upsertMissingReturns(
            Map<String, Order> orderByCode, User manager, List<Product> products, LocalDateTime now
    ) {
        if (orderByCode.isEmpty()) {
            return;
        }
        List<ReturnRequest> existing = returnRepository.findAll();
        Set<String> existingOrderIds = existing.stream()
                .map(ReturnRequest::getOrderId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toCollection(HashSet::new));
        Set<String> existingPairKeys = existing.stream()
                .map(r -> r.getOrderId() + "|" + r.getOrderItemId())
                .collect(Collectors.toCollection(HashSet::new));

        String img = products.stream().filter(p -> !p.getImageUrls().isEmpty())
                .map(p -> p.getImageUrls().get(0)).findFirst().orElse(null);

        List<ReturnRequest> missing = buildReturnRequests(orderByCode, manager, img, now).stream()
                .filter(r -> !existingOrderIds.contains(r.getOrderId())
                        && existingPairKeys.add(r.getOrderId() + "|" + r.getOrderItemId()))
                .toList();
        if (missing.isEmpty()) {
            return;
        }
        List<ReturnRequest> saved = returnRepository.saveAll(missing);
        log.info("Demo ops seed: created {} missing return request(s)", saved.size());
    }

    private void upsertMissingWishlists(
            User c1, User c2, User c3, List<Product> products, LocalDateTime now
    ) {
        List<WishlistItem> existing = wishlistRepository.findAll();
        Set<String> keys = existing.stream()
                .map(w -> w.getUserId() + "|" + w.getProductId())
                .collect(Collectors.toCollection(HashSet::new));
        List<WishlistItem> missing = buildWishlists(
                c1.getUserId(),
                c2 != null ? c2.getUserId() : null,
                c3 != null ? c3.getUserId() : null,
                products,
                now).stream()
                .filter(w -> keys.add(w.getUserId() + "|" + w.getProductId()))
                .toList();
        if (!missing.isEmpty()) {
            wishlistRepository.saveAll(missing);
            log.info("Demo ops seed: created {} missing wishlist item(s)", missing.size());
        }
    }

    private void upsertMissingNotifications(
            User c1, User c2, User c3, List<User> staffUsers, Map<String, Order> orderByCode, LocalDateTime now
    ) {
        List<Notification> existing = notificationRepository.findAll();
        Set<String> keys = existing.stream()
                .map(DemoOperationsSeedService::notificationKey)
                .collect(Collectors.toCollection(HashSet::new));
        List<Notification> missing = buildNotifications(c1, c2, c3, staffUsers, orderByCode, now).stream()
                .filter(n -> keys.add(notificationKey(n)))
                .toList();
        if (!missing.isEmpty()) {
            notificationRepository.saveAll(missing);
            log.info("Demo ops seed: created {} missing notification(s)", missing.size());
        }
    }

    private void upsertMissingAiConversations(User c1, User c2, User c3, LocalDateTime now) {
        List<AiConversation> existing = aiConversationRepository.findAll();
        Set<String> keys = existing.stream()
                .map(conv -> conv.getUserId() + "|" + conv.getTitle())
                .collect(Collectors.toCollection(HashSet::new));
        List<AiConversation> missing = buildAiConversations(
                c1.getUserId(),
                c2 != null ? c2.getUserId() : null,
                c3 != null ? c3.getUserId() : null,
                now).stream()
                .filter(conv -> keys.add(conv.getUserId() + "|" + conv.getTitle()))
                .toList();
        if (!missing.isEmpty()) {
            aiConversationRepository.saveAll(missing);
            log.info("Demo ops seed: created {} missing AI conversation(s)", missing.size());
        }
    }

    private void upsertMissingAuditLogs(User superAdmin, User manager, User staff, LocalDateTime now) {
        List<AuditLog> existing = auditLogRepository.findAll();
        Set<String> keys = existing.stream()
                .map(DemoOperationsSeedService::auditKey)
                .collect(Collectors.toCollection(HashSet::new));
        List<AuditLog> missing = buildAuditLogs(superAdmin, manager, staff, now).stream()
                .filter(logItem -> keys.add(auditKey(logItem)))
                .toList();
        if (!missing.isEmpty()) {
            auditLogRepository.saveAll(missing);
            log.info("Demo ops seed: created {} missing audit log(s)", missing.size());
        }
    }

    private static String addressKey(Address address) {
        return address.getUserId() + "|" + address.getLine1() + "|" + address.getPhone();
    }

    private static String notificationKey(Notification notification) {
        return notification.getUserId() + "|" + notification.getType() + "|"
                + notification.getTitle() + "|" + notification.getTargetUrl();
    }

    private static String auditKey(AuditLog auditLog) {
        return auditLog.getAction() + "|" + auditLog.getTargetType() + "|"
                + auditLog.getTargetId() + "|" + auditLog.getReason();
    }
}
