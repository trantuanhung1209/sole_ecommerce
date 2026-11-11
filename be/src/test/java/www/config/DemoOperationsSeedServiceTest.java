package www.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
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
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.repository.InventoryRepository;
import www.modules.inventory.repository.StockReservationRepository;
import www.modules.notifications.model.Notification;
import www.modules.notifications.repository.NotificationRepository;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.repository.OrderRepository;
import www.modules.payments.repository.EcommercePaymentRepository;
import www.modules.payments.repository.PaymentEventRepository;
import www.modules.promotions.model.Coupon;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DemoOperationsSeedServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private BrandRepository brandRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private CouponUsageRepository couponUsageRepository;
    @Mock private CartRepository cartRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private EcommercePaymentRepository paymentRepository;
    @Mock private PaymentEventRepository paymentEventRepository;
    @Mock private StockReservationRepository reservationRepository;
    @Mock private ReturnRequestRepository returnRepository;
    @Mock private WishlistRepository wishlistRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private AiConversationRepository aiConversationRepository;
    @Mock private AuditLogRepository auditLogRepository;

    private DemoOperationsSeedService service;

    @BeforeEach
    void setUp() {
        service = new DemoOperationsSeedService(
                userRepository, productRepository, variantRepository, brandRepository, inventoryRepository,
                addressRepository, couponRepository, couponUsageRepository, cartRepository, orderRepository,
                paymentRepository, paymentEventRepository, reservationRepository, returnRepository,
                wishlistRepository, notificationRepository, aiConversationRepository, auditLogRepository,
                new ObjectMapper()
        );
        ReflectionTestUtils.setField(service, "seedEnabled", true);
    }

    @Test
    void skipsEverythingWhenDisabled() {
        ReflectionTestUtils.setField(service, "seedEnabled", false);
        service.seedDemoOperationsIfEmpty();
        verifyNoInteractions(userRepository, orderRepository, couponRepository, returnRepository);
    }

    @Test
    void seedsAllEmptyOperationalCollectionsWithMultiPageCountsAndConsistentStatuses() {
        User c1 = User.builder().userId("u1").email("customer@sole.test").role(UserRole.CUSTOMER).build();
        User c2 = User.builder().userId("u2").email("customer2@sole.test").role(UserRole.CUSTOMER).build();
        User c3 = User.builder().userId("u3").email("customer3@sole.test").role(UserRole.CUSTOMER).build();
        User c4 = User.builder().userId("u4").email("customer4@sole.test").role(UserRole.CUSTOMER).build();
        User staff = User.builder().userId("u5").email("staff@sole.test").role(UserRole.STAFF).build();
        User manager = User.builder().userId("u6").email("manager@sole.test").role(UserRole.SHOP_MANAGER).build();
        User superAdmin = User.builder().userId("u7").email("superadmin@sole.test").role(UserRole.SUPER_ADMIN).build();

        when(userRepository.findByEmail("customer@sole.test")).thenReturn(Optional.of(c1));
        when(userRepository.findByEmail("customer2@sole.test")).thenReturn(Optional.of(c2));
        when(userRepository.findByEmail("customer3@sole.test")).thenReturn(Optional.of(c3));
        when(userRepository.findByEmail("customer4@sole.test")).thenReturn(Optional.of(c4));
        when(userRepository.findByEmail("staff@sole.test")).thenReturn(Optional.of(staff));
        when(userRepository.findByEmail("manager@sole.test")).thenReturn(Optional.of(manager));
        when(userRepository.findByEmail("superadmin@sole.test")).thenReturn(Optional.of(superAdmin));
        when(userRepository.findAll()).thenReturn(List.of(c1, c2, c3, c4, staff, manager, superAdmin));

        Brand brand = Brand.builder().brandId("b1").name("Nike").build();
        when(brandRepository.findAll()).thenReturn(List.of(brand));

        List<Product> products = new ArrayList<>();
        List<ProductVariant> variants = new ArrayList<>();
        for (int i = 0; i < 14; i++) {
            String pid = "p" + i;
            products.add(Product.builder().productId(pid).name("Shoe " + i).brandId("b1")
                    .imageUrls(List.of("https://example.com/" + i + ".jpg")).build());
        }
        for (int i = 0; i < 24; i++) {
            variants.add(ProductVariant.builder().variantId("v" + i).productId("p" + (i % 14))
                    .sku("SKU-" + i).size(String.valueOf(39 + (i % 5))).colorName("Black")
                    .price(2200000.0 + i * 50000).build());
        }
        when(productRepository.findAll()).thenReturn(products);
        when(variantRepository.findAll()).thenReturn(variants);

        Inventory inv0 = Inventory.builder().variantId("v0").warehouseId("default").onHand(20).reserved(0).sold(0).available(20).build();
        Inventory invLow = Inventory.builder().variantId("v22").warehouseId("default").onHand(20).reserved(0).sold(0).available(20).build();
        Inventory invOut = Inventory.builder().variantId("v23").warehouseId("default").onHand(20).reserved(0).sold(0).available(20).build();
        when(inventoryRepository.findByVariantIdAndWarehouseId("v0", "default")).thenReturn(Optional.of(inv0));
        when(inventoryRepository.findByVariantIdAndWarehouseId("v22", "default")).thenReturn(Optional.of(invLow));
        when(inventoryRepository.findByVariantIdAndWarehouseId("v23", "default")).thenReturn(Optional.of(invOut));

        when(addressRepository.findAll()).thenReturn(List.of());
        when(couponRepository.findAll()).thenReturn(List.of());
        when(orderRepository.findAll()).thenReturn(List.of());
        when(returnRepository.findAll()).thenReturn(List.of());
        when(wishlistRepository.findAll()).thenReturn(List.of());
        when(notificationRepository.findAll()).thenReturn(List.of());
        when(aiConversationRepository.findAll()).thenReturn(List.of());
        when(auditLogRepository.findAll()).thenReturn(List.of());

        when(addressRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(couponRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Coupon> cs = inv.getArgument(0);
            for (int i = 0; i < cs.size(); i++) cs.get(i).setCouponId("c" + i);
            return cs;
        });
        when(cartRepository.findFirstByUserIdAndStatus(eq("u1"), any())).thenReturn(Optional.empty());
        when(orderRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Order> os = inv.getArgument(0);
            for (int i = 0; i < os.size(); i++) os.get(i).setOrderId("o" + i);
            return os;
        });
        when(paymentRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(returnRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.seedDemoOperationsIfEmpty();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Coupon>> couponsCaptor = ArgumentCaptor.forClass(List.class);
        verify(couponRepository).saveAll(couponsCaptor.capture());
        assertThat(couponsCaptor.getValue()).hasSizeGreaterThanOrEqualTo(12);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Order>> ordersCaptor = ArgumentCaptor.forClass(List.class);
        verify(orderRepository).saveAll(ordersCaptor.capture());
        List<Order> savedOrders = ordersCaptor.getValue();
        assertThat(savedOrders).hasSizeGreaterThanOrEqualTo(16);
        assertThat(savedOrders.stream().filter(o -> "u1".equals(o.getUserId())).count())
                .isGreaterThanOrEqualTo(10);
        Set<OrderStatus> orderStatuses = savedOrders.stream().map(Order::getStatus).collect(Collectors.toSet());
        assertThat(orderStatuses).contains(
                OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED,
                OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.RETURN_REQUESTED, OrderStatus.REFUNDED
        );

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ReturnRequest>> returnsCaptor = ArgumentCaptor.forClass(List.class);
        verify(returnRepository).saveAll(returnsCaptor.capture());
        List<ReturnRequest> savedReturns = returnsCaptor.getValue();
        assertThat(savedReturns).hasSizeGreaterThanOrEqualTo(10);
        assertThat(savedReturns.stream().filter(r -> "u1".equals(r.getUserId())).count())
                .isGreaterThanOrEqualTo(7);
        Set<ReturnStatus> returnStatuses = savedReturns.stream().map(ReturnRequest::getStatus).collect(Collectors.toSet());
        assertThat(returnStatuses).contains(
                ReturnStatus.PENDING, ReturnStatus.STAFF_CONFIRMED, ReturnStatus.APPROVED,
                ReturnStatus.RECEIVED, ReturnStatus.REFUND_PENDING, ReturnStatus.REFUNDED,
                ReturnStatus.REJECTED, ReturnStatus.CLOSED
        );

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<WishlistItem>> wishCaptor = ArgumentCaptor.forClass(List.class);
        verify(wishlistRepository).saveAll(wishCaptor.capture());
        assertThat(wishCaptor.getValue().stream().filter(w -> "u1".equals(w.getUserId())).count())
                .isGreaterThanOrEqualTo(10);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> notifCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(notifCaptor.capture());
        assertThat(notifCaptor.getValue().stream().filter(n -> "u1".equals(n.getUserId())).count())
                .isGreaterThanOrEqualTo(12);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<AuditLog>> auditCaptor = ArgumentCaptor.forClass(List.class);
        verify(auditLogRepository).saveAll(auditCaptor.capture());
        assertThat(auditCaptor.getValue()).hasSizeGreaterThanOrEqualTo(12);

        assertThat(inv0.getReserved()).isEqualTo(1);
        assertThat(inv0.getAvailable()).isEqualTo(19);
        assertThat(invLow.getAvailable()).isEqualTo(3);
        assertThat(invOut.getAvailable()).isEqualTo(0);

        verify(paymentRepository).saveAll(anyList());
        verify(paymentEventRepository, atLeastOnce()).save(any());
        verify(reservationRepository).saveAll(anyList());
        verify(couponUsageRepository).saveAll(anyList());
        verify(aiConversationRepository).saveAll(anyList());
    }

    @Test
    void upsertsOnlyMissingRecordsWhenPartiallyPopulatedAndSkipsWhenComplete() {
        User c1 = User.builder().userId("u1").email("customer@sole.test").role(UserRole.CUSTOMER).build();
        User c2 = User.builder().userId("u2").email("customer2@sole.test").role(UserRole.CUSTOMER).build();
        User staff = User.builder().userId("u3").email("staff@sole.test").role(UserRole.STAFF).build();
        User manager = User.builder().userId("u4").email("manager@sole.test").role(UserRole.SHOP_MANAGER).build();
        User superAdmin = User.builder().userId("u5").email("superadmin@sole.test").role(UserRole.SUPER_ADMIN).build();

        when(userRepository.findByEmail("customer@sole.test")).thenReturn(Optional.of(c1));
        when(userRepository.findByEmail("customer2@sole.test")).thenReturn(Optional.of(c2));
        when(userRepository.findByEmail("customer3@sole.test")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("customer4@sole.test")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("staff@sole.test")).thenReturn(Optional.of(staff));
        when(userRepository.findByEmail("manager@sole.test")).thenReturn(Optional.of(manager));
        when(userRepository.findByEmail("superadmin@sole.test")).thenReturn(Optional.of(superAdmin));
        when(userRepository.findAll()).thenReturn(List.of(c1, c2, staff, manager, superAdmin));

        Brand brand = Brand.builder().brandId("b1").name("Nike").build();
        when(brandRepository.findAll()).thenReturn(List.of(brand));
        List<Product> products = new ArrayList<>();
        List<ProductVariant> variants = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            products.add(Product.builder().productId("p" + i).name("Shoe " + i).brandId("b1")
                    .imageUrls(List.of("https://example.com/" + i + ".jpg")).build());
            variants.add(ProductVariant.builder().variantId("v" + i).productId("p" + i)
                    .sku("SKU-" + i).size("40").colorName("Black").price(2000000.0).build());
        }
        when(productRepository.findAll()).thenReturn(products);
        when(variantRepository.findAll()).thenReturn(variants);
        when(cartRepository.findFirstByUserIdAndStatus(eq("u1"), any())).thenReturn(Optional.of(new www.modules.cart.model.Cart()));

        // Seed all records once into in-memory lists
        List<Address> addressStore = new ArrayList<>();
        List<Coupon> couponStore = new ArrayList<>();
        List<Order> orderStore = new ArrayList<>();
        List<ReturnRequest> returnStore = new ArrayList<>();
        List<WishlistItem> wishlistStore = new ArrayList<>();
        List<Notification> notificationStore = new ArrayList<>();
        List<AiConversation> aiStore = new ArrayList<>();
        List<AuditLog> auditStore = new ArrayList<>();

        // Pre-populate 1 coupon and 15 orders (SO-DEMO-001..015) like an existing MongoDB database
        LocalDateTime now = LocalDateTime.now();
        couponStore.add(Coupon.builder().couponId("c-old").code("SOLE10").build());
        for (int i = 1; i <= 15; i++) {
            String code = DemoOperationsSeedSupport.SEED_ORDER_PREFIX + String.format("%03d", i);
            orderStore.add(Order.builder()
                    .orderId("existing-o-" + i)
                    .orderCode(code)
                    .userId(i % 2 == 0 ? "u2" : "u1")
                    .status(OrderStatus.DELIVERED)
                    .items(List.of(OrderItem.builder().orderItemId("existing-item-" + i).lineTotal(2000000.0).build()))
                    .createdAt(now.minusDays(i))
                    .build());
        }

        when(addressRepository.findAll()).thenAnswer(inv -> new ArrayList<>(addressStore));
        when(addressRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Address> list = inv.getArgument(0);
            addressStore.addAll(list);
            return list;
        });
        when(couponRepository.findAll()).thenAnswer(inv -> new ArrayList<>(couponStore));
        when(couponRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Coupon> list = inv.getArgument(0);
            for (int i = 0; i < list.size(); i++) list.get(i).setCouponId("new-c-" + i);
            couponStore.addAll(list);
            return list;
        });
        when(orderRepository.findAll()).thenAnswer(inv -> new ArrayList<>(orderStore));
        when(orderRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Order> list = inv.getArgument(0);
            for (int i = 0; i < list.size(); i++) list.get(i).setOrderId("new-o-" + i);
            orderStore.addAll(list);
            return list;
        });
        when(returnRepository.findAll()).thenAnswer(inv -> new ArrayList<>(returnStore));
        when(returnRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<ReturnRequest> list = inv.getArgument(0);
            returnStore.addAll(list);
            return list;
        });
        when(wishlistRepository.findAll()).thenAnswer(inv -> new ArrayList<>(wishlistStore));
        when(wishlistRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<WishlistItem> list = inv.getArgument(0);
            wishlistStore.addAll(list);
            return list;
        });
        when(notificationRepository.findAll()).thenAnswer(inv -> new ArrayList<>(notificationStore));
        when(notificationRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Notification> list = inv.getArgument(0);
            notificationStore.addAll(list);
            return list;
        });
        when(aiConversationRepository.findAll()).thenAnswer(inv -> new ArrayList<>(aiStore));
        when(aiConversationRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<AiConversation> list = inv.getArgument(0);
            aiStore.addAll(list);
            return list;
        });
        when(auditLogRepository.findAll()).thenAnswer(inv -> new ArrayList<>(auditStore));
        when(auditLogRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<AuditLog> list = inv.getArgument(0);
            auditStore.addAll(list);
            return list;
        });
        when(paymentRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // First run: should insert only the missing 13 coupons and missing 5 orders (016..020), plus returns/wishlists/etc.
        service.seedDemoOperationsIfEmpty();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Coupon>> missingCoupons = ArgumentCaptor.forClass(List.class);
        verify(couponRepository).saveAll(missingCoupons.capture());
        assertThat(missingCoupons.getValue()).hasSize(13);
        assertThat(missingCoupons.getValue()).extracting(Coupon::getCode).doesNotContain("SOLE10");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Order>> missingOrders = ArgumentCaptor.forClass(List.class);
        verify(orderRepository).saveAll(missingOrders.capture());
        assertThat(missingOrders.getValue()).hasSize(5);
        assertThat(missingOrders.getValue()).extracting(Order::getOrderCode)
                .containsExactlyInAnyOrder(
                        "SO-DEMO-016", "SO-DEMO-017", "SO-DEMO-018", "SO-DEMO-019", "SO-DEMO-020");

        // Second run: everything is present -> zero saves across all repositories
        clearInvocations(addressRepository, couponRepository, orderRepository, returnRepository,
                wishlistRepository, notificationRepository, aiConversationRepository, auditLogRepository);

        service.seedDemoOperationsIfEmpty();

        verify(addressRepository, never()).saveAll(anyList());
        verify(couponRepository, never()).saveAll(anyList());
        verify(orderRepository, never()).saveAll(anyList());
        verify(returnRepository, never()).saveAll(anyList());
        verify(wishlistRepository, never()).saveAll(anyList());
        verify(notificationRepository, never()).saveAll(anyList());
        verify(aiConversationRepository, never()).saveAll(anyList());
        verify(auditLogRepository, never()).saveAll(anyList());
    }
}
