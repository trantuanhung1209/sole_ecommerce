package www.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import www.model.entity.User;
import www.modules.addresses.model.Address;
import www.modules.ai.model.AiConversation;
import www.modules.ai.model.AiMessage;
import www.modules.cart.model.Cart;
import www.modules.cart.model.CartItem;
import www.modules.catalog.model.Brand;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.common.EcommerceEnums.*;
import www.modules.inventory.model.StockReservation;
import www.modules.notifications.model.Notification;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.model.PaymentEvent;
import www.modules.promotions.PromotionEnums.CouponType;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.model.CouponUsage;
import www.modules.rbac.model.AuditLog;
import www.modules.returns.model.ReturnRequest;
import www.modules.wishlist.model.WishlistItem;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pure data builders for {@link DemoOperationsSeedService}, creating realistic,
 * schema-aligned demo records across all operational e-commerce modules.
 */
final class DemoOperationsSeedSupport {

    static final String SEED_ORDER_PREFIX = "SO-DEMO-";

    private DemoOperationsSeedSupport() {}

    static List<Address> buildAddresses(User c1, User c2, User c3, User c4, LocalDateTime now) {
        List<Address> list = new ArrayList<>();
        if (c1 != null) {
            list.add(Address.builder()
                    .userId(c1.getUserId()).recipientName("Nguyễn Minh Anh").phone("0901234567")
                    .line1("128 Nguyễn Huệ").line2("Tầng 4, Tòa nhà Saigon Center")
                    .ward("Phường Bến Nghé").district("Quận 1").city("TP. Hồ Chí Minh")
                    .isDefault(true).createdAt(now.minusDays(20)).updatedAt(now.minusDays(20)).build());
            list.add(Address.builder()
                    .userId(c1.getUserId()).recipientName("Nguyễn Minh Anh (Văn phòng)").phone("0901234567")
                    .line1("45 Lê Lợi").ward("Phường Bến Thành").district("Quận 1").city("TP. Hồ Chí Minh")
                    .isDefault(false).createdAt(now.minusDays(10)).updatedAt(now.minusDays(10)).build());
        }
        if (c2 != null) {
            list.add(Address.builder()
                    .userId(c2.getUserId()).recipientName("Trần Quốc Bảo").phone("0912345678")
                    .line1("88 Phố Huế").ward("Phường Ngô Thì Nhậm").district("Quận Hai Bà Trưng").city("Hà Nội")
                    .isDefault(true).createdAt(now.minusDays(15)).updatedAt(now.minusDays(15)).build());
        }
        if (c3 != null) {
            list.add(Address.builder()
                    .userId(c3.getUserId()).recipientName("Lê Thảo Vy").phone("0901000003")
                    .line1("210 Trần Phú").ward("Phường Hải Châu 1").district("Quận Hải Châu").city("Đà Nẵng")
                    .isDefault(true).createdAt(now.minusDays(12)).updatedAt(now.minusDays(12)).build());
        }
        if (c4 != null) {
            list.add(Address.builder()
                    .userId(c4.getUserId()).recipientName("Phạm Đức Huy").phone("0901000004")
                    .line1("15 Võ Văn Tần").ward("Phường 6").district("Quận 3").city("TP. Hồ Chí Minh")
                    .isDefault(true).createdAt(now.minusDays(8)).updatedAt(now.minusDays(8)).build());
        }
        return list;
    }

    static List<Coupon> buildCoupons(LocalDateTime now) {
        return List.of(
                Coupon.builder().code("SOLE10").type(CouponType.PERCENTAGE).value(10.0)
                        .minOrderAmount(1000000.0).maxDiscount(300000.0).usageLimit(100).usedCount(2).perUserLimit(2)
                        .startsAt(now.minusDays(15)).endsAt(now.plusDays(45)).active(true)
                        .createdAt(now.minusDays(15)).updatedAt(now).build(),
                Coupon.builder().code("SOLE150K").type(CouponType.FIXED_AMOUNT).value(150000.0)
                        .minOrderAmount(1500000.0).usageLimit(50).usedCount(1).perUserLimit(1)
                        .startsAt(now.minusDays(10)).endsAt(now.plusDays(30)).active(true)
                        .createdAt(now.minusDays(10)).updatedAt(now).build(),
                Coupon.builder().code("FREESHIP").type(CouponType.FREE_SHIPPING).value(0.0)
                        .minOrderAmount(500000.0).usageLimit(200).usedCount(1).perUserLimit(3)
                        .startsAt(now.minusDays(20)).endsAt(now.plusDays(60)).active(true)
                        .createdAt(now.minusDays(20)).updatedAt(now).build(),
                Coupon.builder().code("VIP20").type(CouponType.PERCENTAGE).value(20.0)
                        .minOrderAmount(3000000.0).maxDiscount(600000.0).usageLimit(20).usedCount(0).perUserLimit(1)
                        .startsAt(now.minusDays(5)).endsAt(now.plusDays(15)).active(true)
                        .createdAt(now.minusDays(5)).updatedAt(now).build(),
                Coupon.builder().code("SUMMER_OLD").type(CouponType.PERCENTAGE).value(15.0)
                        .minOrderAmount(800000.0).maxDiscount(250000.0).usageLimit(100).usedCount(18).perUserLimit(1)
                        .startsAt(now.minusDays(60)).endsAt(now.minusDays(5)).active(true)
                        .createdAt(now.minusDays(60)).updatedAt(now.minusDays(5)).build(),
                Coupon.builder().code("INACTIVE50").type(CouponType.FIXED_AMOUNT).value(50000.0)
                        .minOrderAmount(500000.0).usageLimit(10).usedCount(10).perUserLimit(1)
                        .startsAt(now.minusDays(30)).endsAt(now.plusDays(10)).active(false)
                        .createdAt(now.minusDays(30)).updatedAt(now).build(),
                Coupon.builder().code("NEWMEMBER").type(CouponType.FIXED_AMOUNT).value(100000.0)
                        .minOrderAmount(800000.0).usageLimit(300).usedCount(1).perUserLimit(1)
                        .startsAt(now.minusDays(12)).endsAt(now.plusDays(60)).active(true)
                        .createdAt(now.minusDays(12)).updatedAt(now).build(),
                Coupon.builder().code("RUN25").type(CouponType.PERCENTAGE).value(25.0)
                        .minOrderAmount(2000000.0).maxDiscount(500000.0).usageLimit(40).usedCount(3).perUserLimit(1)
                        .startsAt(now.minusDays(5)).endsAt(now.plusDays(25)).active(true)
                        .createdAt(now.minusDays(5)).updatedAt(now).build(),
                Coupon.builder().code("FREESHIP_PRO").type(CouponType.FREE_SHIPPING).value(0.0)
                        .minOrderAmount(1000000.0).usageLimit(150).usedCount(4).perUserLimit(2)
                        .startsAt(now.minusDays(7)).endsAt(now.plusDays(90)).active(true)
                        .createdAt(now.minusDays(7)).updatedAt(now).build(),
                Coupon.builder().code("WEEKEND200K").type(CouponType.FIXED_AMOUNT).value(200000.0)
                        .minOrderAmount(2500000.0).usageLimit(60).usedCount(5).perUserLimit(1)
                        .startsAt(now.minusDays(2)).endsAt(now.plusDays(14)).active(true)
                        .createdAt(now.minusDays(2)).updatedAt(now).build(),
                Coupon.builder().code("BLACKFRIDAY26").type(CouponType.PERCENTAGE).value(30.0)
                        .minOrderAmount(2500000.0).maxDiscount(800000.0).usageLimit(80).usedCount(0).perUserLimit(1)
                        .startsAt(now.plusDays(7)).endsAt(now.plusDays(21)).active(true)
                        .createdAt(now.minusDays(1)).updatedAt(now).build(),
                Coupon.builder().code("TET2027").type(CouponType.FIXED_AMOUNT).value(300000.0)
                        .minOrderAmount(3000000.0).usageLimit(120).usedCount(0).perUserLimit(1)
                        .startsAt(now.plusDays(30)).endsAt(now.plusDays(45)).active(true)
                        .createdAt(now.minusDays(1)).updatedAt(now).build(),
                Coupon.builder().code("AUTUMN_END").type(CouponType.PERCENTAGE).value(12.0)
                        .minOrderAmount(1000000.0).maxDiscount(200000.0).usageLimit(100).usedCount(42).perUserLimit(2)
                        .startsAt(now.minusDays(45)).endsAt(now.minusDays(2)).active(true)
                        .createdAt(now.minusDays(45)).updatedAt(now.minusDays(2)).build(),
                Coupon.builder().code("DRAFT_VIP").type(CouponType.FIXED_AMOUNT).value(500000.0)
                        .minOrderAmount(5000000.0).usageLimit(15).usedCount(0).perUserLimit(1)
                        .startsAt(now.minusDays(1)).endsAt(now.plusDays(30)).active(false)
                        .createdAt(now.minusDays(1)).updatedAt(now).build()
        );
    }

    static OrderItem toOrderItem(
            ProductVariant variant,
            Product product,
            Map<String, Brand> brandMap,
            int quantity,
            boolean reviewed,
            String returnStatus
    ) {
        String brandName = product != null && product.getBrandId() != null && brandMap.containsKey(product.getBrandId())
                ? brandMap.get(product.getBrandId()).getName()
                : "SOLE";
        String image = !variant.getImageUrls().isEmpty()
                ? variant.getImageUrls().get(0)
                : (product != null && !product.getImageUrls().isEmpty() ? product.getImageUrls().get(0) : null);
        double unitPrice = variant.getPrice() != null ? variant.getPrice() : 0.0;
        return OrderItem.builder()
                .orderItemId(UUID.randomUUID().toString())
                .productId(product != null ? product.getProductId() : variant.getProductId())
                .variantId(variant.getVariantId())
                .skuSnapshot(variant.getSku())
                .productNameSnapshot(product != null ? product.getName() : "SOLE Sneaker")
                .brandNameSnapshot(brandName)
                .sizeSnapshot(variant.getSize())
                .colorSnapshot(variant.getColorName())
                .imageSnapshot(image)
                .unitPrice(unitPrice)
                .quantity(quantity)
                .discountAmount(0.0)
                .lineTotal(unitPrice * quantity)
                .reviewed(reviewed)
                .returnStatus(returnStatus)
                .build();
    }

    static String serializeAddress(ObjectMapper mapper, Address addr) {
        if (addr == null) {
            return "{\"recipientName\":\"Khách Demo\",\"phone\":\"0901234567\",\"line1\":\"128 Nguyễn Huệ\",\"city\":\"TP. Hồ Chí Minh\"}";
        }
        try {
            return mapper.writeValueAsString(addr);
        } catch (JsonProcessingException e) {
            return addr.getRecipientName() + ", " + addr.getPhone() + ", " + addr.getLine1() + ", " + addr.getCity();
        }
    }

    static Order buildOrder(
            String orderCode, String userId, String addressSnapshot, List<OrderItem> items,
            OrderStatus status, EcommercePaymentStatus paymentStatus, FulfillmentStatus fulfillmentStatus,
            double discountTotal, double shippingFee, String couponCode, String customerNote,
            String cancelReason, String trackingCode,
            LocalDateTime createdAt, LocalDateTime paidAt, LocalDateTime deliveredAt,
            LocalDateTime completedAt, LocalDateTime cancelledAt
    ) {
        double subtotal = items.stream().mapToDouble(OrderItem::getLineTotal).sum();
        double grandTotal = Math.max(0.0, subtotal - discountTotal + shippingFee);
        return Order.builder()
                .orderCode(orderCode)
                .userId(userId)
                .status(status)
                .paymentStatus(paymentStatus)
                .fulfillmentStatus(fulfillmentStatus)
                .shippingAddressSnapshot(addressSnapshot)
                .items(new ArrayList<>(items))
                .subtotal(subtotal)
                .discountTotal(discountTotal)
                .shippingFee(shippingFee)
                .taxTotal(0.0)
                .grandTotal(grandTotal)
                .couponCode(couponCode)
                .customerNote(customerNote)
                .cancelReason(cancelReason)
                .trackingCode(trackingCode)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .paidAt(paidAt)
                .deliveredAt(deliveredAt)
                .completedAt(completedAt)
                .cancelledAt(cancelledAt)
                .build();
    }

    static EcommercePayment buildPayment(Order order, LocalDateTime now) {
        EcommercePaymentStatus pStatus = order.getPaymentStatus();
        String invoice = "ORDER_" + order.getOrderCode();
        String txId = (pStatus == EcommercePaymentStatus.COMPLETED || pStatus == EcommercePaymentStatus.REFUNDED)
                ? "SEPAY-TX-" + order.getOrderCode()
                : null;
        return EcommercePayment.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .orderInvoiceNumber(invoice)
                .amount(order.getGrandTotal())
                .currency("VND")
                .method("SEPAY")
                .status(pStatus)
                .paymentUrl("https://pay-sandbox.sepay.vn/v1/checkout/init")
                .successUrl("http://localhost:3000/payment/success?orderId=" + order.getOrderId() + "&orderCode=" + order.getOrderCode())
                .errorUrl("http://localhost:3000/payment/error?orderId=" + order.getOrderId() + "&orderCode=" + order.getOrderCode())
                .cancelUrl("http://localhost:3000/payment/cancel?orderId=" + order.getOrderId() + "&orderCode=" + order.getOrderCode())
                .transactionId(txId)
                .gatewayResponse(txId != null ? "{\"status\":\"PAID\",\"invoice\":\"" + invoice + "\"}" : null)
                .paidAt(order.getPaidAt())
                .cancelledAt(order.getCancelledAt())
                .expiredAt(pStatus == EcommercePaymentStatus.PENDING ? now.plusDays(7) : order.getCreatedAt().plusMinutes(15))
                .refundStatus(pStatus == EcommercePaymentStatus.REFUNDED ? RefundStatus.COMPLETED : null)
                .refundMethod(pStatus == EcommercePaymentStatus.REFUNDED ? RefundMethod.BANK_TRANSFER : null)
                .refundedAmount(pStatus == EcommercePaymentStatus.REFUNDED ? order.getGrandTotal() : null)
                .refundTransactionRef(pStatus == EcommercePaymentStatus.REFUNDED ? "REF-" + order.getOrderCode() : null)
                .refundedAt(pStatus == EcommercePaymentStatus.REFUNDED ? order.getUpdatedAt() : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    static PaymentEvent buildPaymentEvent(EcommercePayment payment) {
        return PaymentEvent.builder()
                .gateway("SEPAY")
                .orderInvoiceNumber(payment.getOrderInvoiceNumber())
                .transactionId(payment.getTransactionId())
                .eventType("ORDER_PAID")
                .rawPayload("{\"order_invoice_number\":\"" + payment.getOrderInvoiceNumber() + "\",\"transaction_id\":\"" + payment.getTransactionId() + "\",\"amount\":" + payment.getAmount() + "}")
                .signature("seed-verified")
                .processed(true)
                .processedAt(payment.getPaidAt())
                .createdAt(payment.getPaidAt())
                .build();
    }

    static StockReservation buildReservation(Order order, OrderItem item, ReservationStatus status, LocalDateTime expiresAt) {
        return StockReservation.builder()
                .orderId(order.getOrderId())
                .variantId(item.getVariantId())
                .quantity(item.getQuantity())
                .status(status)
                .expiresAt(expiresAt)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    static CouponUsage buildCouponUsage(Coupon coupon, Order order) {
        return CouponUsage.builder()
                .couponId(coupon.getCouponId())
                .code(coupon.getCode())
                .userId(order.getUserId())
                .orderId(order.getOrderId())
                .discountApplied(order.getDiscountTotal())
                .usedAt(order.getCreatedAt())
                .build();
    }

    static Cart buildCustomerCart(String userId, List<ProductVariant> variants, LocalDateTime now) {
        List<CartItem> items = new ArrayList<>();
        if (!variants.isEmpty()) {
            ProductVariant v1 = variants.get(0);
            items.add(CartItem.builder().variantId(v1.getVariantId()).quantity(1)
                    .priceSnapshot(v1.getPrice()).addedAt(now.minusHours(3)).build());
        }
        if (variants.size() > 2) {
            ProductVariant v2 = variants.get(2);
            items.add(CartItem.builder().variantId(v2.getVariantId()).quantity(2)
                    .priceSnapshot(v2.getPrice()).addedAt(now.minusHours(1)).build());
        }
        return Cart.builder().userId(userId).status(CartStatus.ACTIVE).items(items)
                .createdAt(now.minusHours(3)).updatedAt(now.minusHours(1)).build();
    }

    static List<WishlistItem> buildWishlists(String c1Id, String c2Id, String c3Id, List<Product> products, LocalDateTime now) {
        List<WishlistItem> items = new ArrayList<>();
        int c1Limit = Math.min(12, products.size());
        for (int i = 0; i < c1Limit; i++) {
            items.add(WishlistItem.builder().userId(c1Id).productId(products.get(i).getProductId())
                    .createdAt(now.minusDays(15L - i)).build());
        }
        if (c2Id != null && products.size() > 6) {
            items.add(WishlistItem.builder().userId(c2Id).productId(products.get(4).getProductId())
                    .createdAt(now.minusDays(4)).build());
            items.add(WishlistItem.builder().userId(c2Id).productId(products.get(5).getProductId())
                    .createdAt(now.minusDays(2)).build());
            items.add(WishlistItem.builder().userId(c2Id).productId(products.get(6).getProductId())
                    .createdAt(now.minusDays(1)).build());
        }
        if (c3Id != null && products.size() > 7) {
            items.add(WishlistItem.builder().userId(c3Id).productId(products.get(1).getProductId())
                    .createdAt(now.minusDays(3)).build());
            items.add(WishlistItem.builder().userId(c3Id).productId(products.get(7).getProductId())
                    .createdAt(now.minusDays(1)).build());
        }
        return items;
    }

    static List<AiConversation> buildAiConversations(String c1Id, String c2Id, String c3Id, LocalDateTime now) {
        List<AiConversation> list = new ArrayList<>();
        list.add(AiConversation.builder()
                .userId(c1Id)
                .title("Tư vấn chọn size giày chạy bộ Nike & Adidas")
                .messages(List.of(
                        AiMessage.builder().role("user").content("Chân mình dài 26cm hơi bè, đi Nike Air Max 90 size nào hợp?")
                                .routeType(AiRouteType.SIZE_ADVICE.name()).timestamp(now.minusDays(2)).build(),
                        AiMessage.builder().role("assistant")
                                .content("Với bàn chân dài 26cm và hơi bè, bạn nên chọn size EU 42 (tăng 0.5 size so với form ôm của Nike) để mũi chân thoải mái khi chạy hoặc đi bộ cả ngày.")
                                .routeType(AiRouteType.SIZE_ADVICE.name()).timestamp(now.minusDays(2).plusSeconds(5)).build()
                ))
                .createdAt(now.minusDays(2)).updatedAt(now.minusDays(2).plusSeconds(5)).build());
        list.add(AiConversation.builder()
                .userId(c1Id)
                .title("Hỏi chính sách đổi trả & hoàn tiền")
                .messages(List.of(
                        AiMessage.builder().role("user").content("Giày giao nhầm size thì đổi trả trong bao lâu?")
                                .routeType(AiRouteType.RETURN_POLICY.name()).timestamp(now.minusHours(12)).build(),
                        AiMessage.builder().role("assistant")
                                .content("SOLE hỗ trợ yêu cầu đổi/trả trong vòng 7 ngày kể từ khi đơn hàng chuyển sang DELIVERED hoặc COMPLETED. Sau khi được duyệt, bạn có 7 ngày để gửi lại hàng kèm thông tin ngân hàng hoàn tiền.")
                                .routeType(AiRouteType.RETURN_POLICY.name()).timestamp(now.minusHours(12).plusSeconds(4)).build()
                ))
                .createdAt(now.minusHours(12)).updatedAt(now.minusHours(12).plusSeconds(4)).build());
        list.add(AiConversation.builder()
                .userId(c1Id)
                .title("So sánh HOKA Clifton 9 và Nike Pegasus 41")
                .messages(List.of(
                        AiMessage.builder().role("user").content("Chạy 5-10km đường nhựa hằng ngày nên chọn Clifton 9 hay Pegasus 41?")
                                .routeType(AiRouteType.PRODUCT_INFO.name()).timestamp(now.minusHours(5)).build(),
                        AiMessage.builder().role("assistant")
                                .content("Clifton 9 nhẹ và đệm êm giảm chấn khớp tốt; Pegasus 41 nảy và linh hoạt hơn khi chạy nhanh. Nếu ưu tiên êm chân phục hồi chọn HOKA, muốn đa năng chọn Pegasus.")
                                .routeType(AiRouteType.PRODUCT_INFO.name()).timestamp(now.minusHours(5).plusSeconds(4)).build()
                ))
                .createdAt(now.minusHours(5)).updatedAt(now.minusHours(5).plusSeconds(4)).build());
        if (c2Id != null) {
            list.add(AiConversation.builder()
                    .userId(c2Id)
                    .title("Gợi ý sneaker trắng dễ phối đồ")
                    .messages(List.of(
                            AiMessage.builder().role("user").content("Tầm 2-3 triệu có mẫu sneaker trắng nào đi làm đẹp?")
                                    .routeType(AiRouteType.PRODUCT_INFO.name()).timestamp(now.minusDays(1)).build(),
                            AiMessage.builder().role("assistant")
                                    .content("Bạn có thể tham khảo Nike Air Force 1 '07, Reebok Club C 85 Vintage hoặc Adidas Samba OG — đều có phiên bản trắng tối giản, dễ phối đồ công sở lẫn đi chơi.")
                                    .routeType(AiRouteType.PRODUCT_INFO.name()).timestamp(now.minusDays(1).plusSeconds(4)).build()
                    ))
                    .createdAt(now.minusDays(1)).updatedAt(now.minusDays(1).plusSeconds(4)).build());
        }
        if (c3Id != null) {
            list.add(AiConversation.builder()
                    .userId(c3Id)
                    .title("Tìm giày chạy trail chống nước đi Đà Lạt")
                    .messages(List.of(
                            AiMessage.builder().role("user").content("Có mẫu giày trail nào chống mưa nhẹ và bám đường tốt?")
                                    .routeType(AiRouteType.PRODUCT_INFO.name()).timestamp(now.minusHours(9)).build(),
                            AiMessage.builder().role("assistant")
                                    .content("Salomon XT-6 GTX có màng GORE-TEX chống thấm và đế Contagrip bám rất chắc trên đá ướt.")
                                    .routeType(AiRouteType.PRODUCT_INFO.name()).timestamp(now.minusHours(9).plusSeconds(4)).build()
                    ))
                    .createdAt(now.minusHours(9)).updatedAt(now.minusHours(9).plusSeconds(4)).build());
        }
        return list;
    }

    static List<AuditLog> buildAuditLogs(User superAdmin, User manager, User staff, LocalDateTime now) {
        String actor1 = superAdmin != null ? superAdmin.getUserId() : "superadmin-seed";
        String actor2 = manager != null ? manager.getUserId() : actor1;
        String actor3 = staff != null ? staff.getUserId() : actor2;
        return List.of(
                AuditLog.builder().actorId(actor1).action("UPDATE_ROLE_PERMISSION").targetType("ROLE_PERMISSION")
                        .targetId("SHOP_MANAGER:CATALOG_APPROVE").beforeValue("enabled=false").afterValue("enabled=true")
                        .reason("Mở quyền duyệt sản phẩm cho Quản lý Shop").createdAt(now.minusDays(14)).build(),
                AuditLog.builder().actorId(actor2).action("CREATE_COUPON").targetType("COUPON")
                        .targetId("SOLE10").beforeValue(null).afterValue("PERCENTAGE 10%, max 300000")
                        .reason("Khởi tạo chương trình khuyến mãi tháng").createdAt(now.minusDays(12)).build(),
                AuditLog.builder().actorId(actor2).action("CONFIRM_REFUND").targetType("RETURN_REQUEST")
                        .targetId(SEED_ORDER_PREFIX + "010").beforeValue("status=REFUND_PENDING")
                        .afterValue("status=REFUNDED, method=BANK_TRANSFER")
                        .reason("Đã chuyển khoản hoàn tiền cho khách hàng").createdAt(now.minusDays(1)).build(),
                AuditLog.builder().actorId(actor2).action("PUBLISH_PRODUCT").targetType("PRODUCT")
                        .targetId("salomon-xt-6-gtx").beforeValue("status=APPROVED, publicStatus=DRAFT")
                        .afterValue("status=PUBLISHED, publicStatus=PUBLISHED")
                        .reason("Xuất bản bộ sưu tập Trail Gorpcore mới").createdAt(now.minusDays(10)).build(),
                AuditLog.builder().actorId(actor2).action("PUBLISH_PRODUCT").targetType("PRODUCT")
                        .targetId("air-jordan-4-retro-bred").beforeValue("status=APPROVED")
                        .afterValue("status=PUBLISHED")
                        .reason("Mở bán phiên bản Limited Edition Jordan 4 Bred").createdAt(now.minusDays(9)).build(),
                AuditLog.builder().actorId(actor3).action("ADJUST_INVENTORY").targetType("INVENTORY")
                        .targetId("SALOMON-XT6B-44").beforeValue("available=10").afterValue("available=2")
                        .reason("Kiểm kê xuất kho sự kiện Trail Weekend").createdAt(now.minusDays(8)).build(),
                AuditLog.builder().actorId(actor3).action("ADJUST_INVENTORY").targetType("INVENTORY")
                        .targetId("JORDAN-AJ4BR-45").beforeValue("available=8").afterValue("available=2")
                        .reason("Điều chỉnh tồn kho sau đơn đặt trước").createdAt(now.minusDays(7)).build(),
                AuditLog.builder().actorId(actor3).action("RESTOCK_INVENTORY").targetType("INVENTORY")
                        .targetId("NIKE-PND-41").beforeValue("onHand=18").afterValue("onHand=48")
                        .reason("Nhập bổ sung 30 đôi Nike Dunk Low Panda size 41").createdAt(now.minusDays(6)).build(),
                AuditLog.builder().actorId(actor3).action("UPDATE_ORDER_STATUS").targetType("ORDER")
                        .targetId(SEED_ORDER_PREFIX + "005").beforeValue("status=PROCESSING")
                        .afterValue("status=SHIPPED, tracking=GHN-SOLE-99210")
                        .reason("Bàn giao kiện hàng cho Giao Hàng Nhanh").createdAt(now.minusDays(5)).build(),
                AuditLog.builder().actorId(actor2).action("APPROVE_RETURN").targetType("RETURN_REQUEST")
                        .targetId(SEED_ORDER_PREFIX + "012").beforeValue("status=STAFF_CONFIRMED")
                        .afterValue("status=APPROVED")
                        .reason("Duyệt đổi màu sắc trong hạn 7 ngày").createdAt(now.minusDays(4)).build(),
                AuditLog.builder().actorId(actor2).action("REJECT_RETURN").targetType("RETURN_REQUEST")
                        .targetId(SEED_ORDER_PREFIX + "015").beforeValue("status=PENDING")
                        .afterValue("status=REJECTED")
                        .reason("Giày có dấu hiệu sử dụng ngoài trời").createdAt(now.minusDays(3)).build(),
                AuditLog.builder().actorId(actor1).action("LOCK_USER").targetType("USER")
                        .targetId("locked@sole.test").beforeValue("isActive=true").afterValue("isActive=false")
                        .reason("Tạm khóa tài khoản demo phục vụ kiểm thử bộ lọc").createdAt(now.minusDays(2)).build(),
                AuditLog.builder().actorId(actor2).action("CREATE_COUPON").targetType("COUPON")
                        .targetId("BLACKFRIDAY26").beforeValue(null).afterValue("PERCENTAGE 30%, scheduled +7d")
                        .reason("Lên lịch chiến dịch Black Friday").createdAt(now.minusHours(18)).build(),
                AuditLog.builder().actorId(actor3).action("RESTOCK_INVENTORY").targetType("INVENTORY")
                        .targetId("HOKA-CL9P-37").beforeValue("onHand=12").afterValue("onHand=32")
                        .reason("Nhập lô HOKA Clifton 9 mới về kho").createdAt(now.minusHours(6)).build()
        );
    }

    static List<Notification> buildNotifications(
            User c1, User c2, User c3, List<User> staffUsers, Map<String, Order> orderByCode, LocalDateTime now
    ) {
        List<Notification> list = new ArrayList<>();
        if (c1 != null) {
            String o1 = orderId(orderByCode, SEED_ORDER_PREFIX + "001");
            String o3 = orderId(orderByCode, SEED_ORDER_PREFIX + "003");
            String o5 = orderId(orderByCode, SEED_ORDER_PREFIX + "005");
            String o6 = orderId(orderByCode, SEED_ORDER_PREFIX + "006");
            String o7 = orderId(orderByCode, SEED_ORDER_PREFIX + "007");
            String o9 = orderId(orderByCode, SEED_ORDER_PREFIX + "009");
            String o10 = orderId(orderByCode, SEED_ORDER_PREFIX + "010");
            String o12 = orderId(orderByCode, SEED_ORDER_PREFIX + "012");
            String o14 = orderId(orderByCode, SEED_ORDER_PREFIX + "014");
            String o16 = orderId(orderByCode, SEED_ORDER_PREFIX + "016");
            String o17 = orderId(orderByCode, SEED_ORDER_PREFIX + "017");
            String o18 = orderId(orderByCode, SEED_ORDER_PREFIX + "018");

            list.add(notif(c1, NotificationType.ORDER_CREATED, "Đơn hàng chờ thanh toán",
                    "Đơn " + SEED_ORDER_PREFIX + "001 đang chờ thanh toán qua SePay.", "/orders/" + o1, false, now.minusMinutes(20)));
            list.add(notif(c1, NotificationType.ORDER_SHIPPED, "Đơn hàng đang giao",
                    "Đơn " + SEED_ORDER_PREFIX + "005 đã bàn giao cho đơn vị vận chuyển.", "/orders/" + o5, false, now.minusHours(5)));
            list.add(notif(c1, NotificationType.ORDER_DELIVERED, "Giao hàng thành công",
                    "Đơn " + SEED_ORDER_PREFIX + "006 đã giao thành công. Bạn có thể đánh giá sản phẩm!", "/orders/" + o6, true, now.minusDays(2)));
            list.add(notif(c1, NotificationType.REFUND_COMPLETED, "Hoàn tiền thành công",
                    "Yêu cầu trả hàng của đơn " + SEED_ORDER_PREFIX + "010 đã được hoàn tiền.", "/returns", false, now.minusDays(1)));
            list.add(notif(c1, NotificationType.PAYMENT_SUCCESS, "Thanh toán thành công #003",
                    "Giao dịch SePay cho đơn " + SEED_ORDER_PREFIX + "003 đã được xác nhận.", "/orders/" + o3, true, now.minusHours(17)));
            list.add(notif(c1, NotificationType.ORDER_PAID, "Đơn hàng đã xác nhận #003",
                    "Kho đang chuẩn bị đóng gói đơn " + SEED_ORDER_PREFIX + "003.", "/orders/" + o3, true, now.minusHours(16)));
            list.add(notif(c1, NotificationType.ORDER_DELIVERED, "Hoàn tất đơn hàng #007",
                    "Đơn " + SEED_ORDER_PREFIX + "007 đã hoàn tất. Cảm ơn bạn đã mua sắm tại SOLE.", "/orders/" + o7, true, now.minusDays(4)));
            list.add(notif(c1, NotificationType.RETURN_REQUESTED, "Đã tiếp nhận yêu cầu đổi trả #009",
                    "Yêu cầu đổi size cho đơn " + SEED_ORDER_PREFIX + "009 đang chờ nhân viên xác nhận.", "/returns", false, now.minusHours(9)));
            list.add(notif(c1, NotificationType.RETURN_APPROVED, "Yêu cầu đổi trả #012 đã được duyệt",
                    "Vui lòng gửi lại sản phẩm của đơn " + SEED_ORDER_PREFIX + "012 trong vòng 7 ngày.", "/returns", false, now.minusDays(1)));
            list.add(notif(c1, NotificationType.REFUND_PENDING, "Đang xử lý hoàn tiền #014",
                    "Kho đã nhận lại hàng từ đơn " + SEED_ORDER_PREFIX + "014 và chuyển bộ phận kế toán.", "/returns", false, now.minusDays(3)));
            list.add(notif(c1, NotificationType.ORDER_DELIVERED, "Đơn #016 đã giao tới bạn",
                    "Đơn " + SEED_ORDER_PREFIX + "016 đã giao thành công tại Quận 1.", "/orders/" + o16, true, now.minusDays(2)));
            list.add(notif(c1, NotificationType.RETURN_REQUESTED, "Tiếp nhận yêu cầu hoàn trả #016",
                    "Bộ phận CSKH đã nhận yêu cầu kiểm tra cho đơn " + SEED_ORDER_PREFIX + "016.", "/returns", false, now.minusHours(7)));
            list.add(notif(c1, NotificationType.ORDER_DELIVERED, "Đơn #017 hoàn tất giao hàng",
                    "Đơn " + SEED_ORDER_PREFIX + "017 đã giao đủ sản phẩm.", "/orders/" + o17, true, now.minusDays(12)));
            list.add(notif(c1, NotificationType.REFUND_COMPLETED, "Đã đóng hồ sơ hoàn trả #017",
                    "Yêu cầu đổi trả đơn " + SEED_ORDER_PREFIX + "017 đã hoàn tất và đóng hồ sơ.", "/returns", true, now.minusDays(5)));
            list.add(notif(c1, NotificationType.PAYMENT_SUCCESS, "Thanh toán đơn #018 thành công",
                    "Đơn " + SEED_ORDER_PREFIX + "018 đã thanh toán và đang xử lý đóng gói.", "/orders/" + o18, false, now.minusHours(4)));
            list.add(notif(c1, NotificationType.RETURN_REJECTED, "Thông báo kết quả kiểm tra #007",
                    "Yêu cầu trả hàng ngoài hạn 7 ngày cho đơn " + SEED_ORDER_PREFIX + "007 không được chấp thuận.", "/returns", true, now.minusDays(3)));
            list.add(notif(c1, NotificationType.SYSTEM, "Ưu đãi thành viên RUN25",
                    "Nhập mã RUN25 để giảm 25% tối đa 500.000đ cho giày chạy bộ tuần này.", "/promotions", false, now.minusHours(14)));
            list.add(notif(c1, NotificationType.SYSTEM, "Freeship đơn từ 500K",
                    "Mã FREESHIP áp dụng miễn phí vận chuyển toàn quốc cho mọi đơn hàng.", "/products", true, now.minusDays(6)));
            list.add(notif(c1, NotificationType.SYSTEM, "Hàng mới về: Salomon & HOKA",
                    "Khám phá bộ sưu tập Trail & Max Cushion vừa lên kệ tại SOLE.", "/products", false, now.minusHours(11)));
            list.add(notif(c1, NotificationType.SYSTEM, "Nhắc nhở bảo quản sneaker da lộn",
                    "Sử dụng bàn chải lông mềm và bình xịt chống thấm để giữ form giày bền đẹp.", "/products", true, now.minusDays(8)));
            list.add(notif(c1, NotificationType.ORDER_PAID, "Hóa đơn điện tử đơn #010",
                    "Biên lai thanh toán đơn " + SEED_ORDER_PREFIX + "010 đã được lưu trong lịch sử.", "/orders/" + o10, true, now.minusDays(9)));
            list.add(notif(c1, NotificationType.RETURN_APPROVED, "Hướng dẫn đóng gói hoàn hàng #006",
                    "Vui lòng giữ nguyên hộp giày và tem tag khi gửi hoàn đơn " + SEED_ORDER_PREFIX + "006.", "/returns", false, now.minusHours(3)));
        }
        if (c2 != null) {
            String o2 = orderId(orderByCode, SEED_ORDER_PREFIX + "002");
            String o4 = orderId(orderByCode, SEED_ORDER_PREFIX + "004");
            String o8 = orderId(orderByCode, SEED_ORDER_PREFIX + "008");
            list.add(notif(c2, NotificationType.PAYMENT_SUCCESS, "Thanh toán thành công",
                    "Đơn " + SEED_ORDER_PREFIX + "002 đã xác nhận thanh toán.", "/orders/" + o2, false, now.minusHours(8)));
            list.add(notif(c2, NotificationType.ORDER_PAID, "Đơn hàng đang đóng gói",
                    "Đơn " + SEED_ORDER_PREFIX + "004 đang được chuẩn bị tại kho.", "/orders/" + o4, true, now.minusDays(1)));
            list.add(notif(c2, NotificationType.ORDER_CANCELLED, "Đơn hàng đã hủy",
                    "Đơn " + SEED_ORDER_PREFIX + "008 đã được hủy theo yêu cầu của bạn.", "/orders/" + o8, true, now.minusDays(5)));
        }
        if (c3 != null) {
            String o19 = orderId(orderByCode, SEED_ORDER_PREFIX + "019");
            list.add(notif(c3, NotificationType.ORDER_SHIPPED, "Đơn hàng đang trên đường giao",
                    "Đơn " + SEED_ORDER_PREFIX + "019 đang được giao tới Đà Nẵng.", "/orders/" + o19, false, now.minusHours(6)));
        }
        for (User staff : staffUsers) {
            list.add(notif(staff, NotificationType.STAFF_NEW_ORDER, "Đơn hàng mới cần xử lý",
                    "Có đơn hàng mới đã thanh toán cần xác nhận đóng gói.", "/admin/orders", false, now.minusHours(2)));
            list.add(notif(staff, NotificationType.STAFF_NEW_RETURN, "Yêu cầu đổi/trả chờ duyệt",
                    "Có yêu cầu trả hàng mới và 1 yêu cầu hoàn tiền quá hạn cần xử lý.", "/admin/returns", false, now.minusHours(1)));
            list.add(notif(staff, NotificationType.SYSTEM, "Cảnh báo tồn kho thấp",
                    "Một số biến thể Salomon XT-6, Jordan 4 Bred và NB 990v6 còn dưới 5 đôi.", "/admin/inventory", false, now.minusMinutes(45)));
        }
        return list;
    }

    private static String orderId(Map<String, Order> orderByCode, String orderCode) {
        Order order = orderByCode.get(orderCode);
        return order != null && order.getOrderId() != null ? order.getOrderId() : orderCode;
    }

    private static Notification notif(
            User user, NotificationType type, String title, String message,
            String targetUrl, boolean read, LocalDateTime createdAt
    ) {
        return Notification.builder()
                .userId(user.getUserId())
                .type(type)
                .title(title)
                .message(message)
                .targetUrl(targetUrl)
                .read(read)
                .createdAt(createdAt)
                .build();
    }

    static List<ReturnRequest> buildReturnRequests(
            Map<String, Order> orderByCode, User manager, String sampleImageUrl, LocalDateTime now
    ) {
        String managerId = manager != null ? manager.getUserId() : "manager-seed";
        List<String> images = sampleImageUrl != null ? List.of(sampleImageUrl) : List.of();
        List<ReturnRequest> returns = new ArrayList<>();

        // 0: PENDING (customer1)
        Order o9 = orderByCode.get(SEED_ORDER_PREFIX + "009");
        if (o9 != null && !o9.getItems().isEmpty()) {
            OrderItem item = o9.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o9.getOrderId()).orderItemId(item.getOrderItemId()).userId(o9.getUserId())
                    .reason("Nhầm kích cỡ (muốn đổi size lớn hơn)").customerNote("Chân hơi chật ở mũi, giày còn nguyên tem hộp.")
                    .imageUrls(images).status(ReturnStatus.PENDING).refundStatus(RefundStatus.NOT_REQUIRED)
                    .refundAmount(item.getLineTotal()).refundBankName("Vietcombank")
                    .refundAccountNumber("0071001234567").refundAccountHolder("NGUYEN MINH ANH")
                    .createdAt(now.minusHours(10)).updatedAt(now.minusHours(10)).build());
        }
        // 1: STAFF_CONFIRMED (customer2)
        Order o11 = orderByCode.get(SEED_ORDER_PREFIX + "011");
        if (o11 != null && !o11.getItems().isEmpty()) {
            OrderItem item = o11.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o11.getOrderId()).orderItemId(item.getOrderItemId()).userId(o11.getUserId())
                    .reason("Lỗi keo đế nhẹ ở gót trái").customerNote("Phát hiện ngay khi mở hộp.")
                    .imageUrls(images).status(ReturnStatus.STAFF_CONFIRMED).staffNote("Đã kiểm tra ảnh khách gửi, đủ điều kiện đổi trả.")
                    .refundStatus(RefundStatus.NOT_REQUIRED).refundAmount(item.getLineTotal())
                    .refundBankName("Techcombank").refundAccountNumber("19035678901234").refundAccountHolder("TRAN QUOC BAO")
                    .staffConfirmedAt(now.minusHours(4)).createdAt(now.minusDays(1)).updatedAt(now.minusHours(4)).build());
        }
        // 2: APPROVED (customer1)
        Order o12 = orderByCode.get(SEED_ORDER_PREFIX + "012");
        if (o12 != null && !o12.getItems().isEmpty()) {
            OrderItem item = o12.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o12.getOrderId()).orderItemId(item.getOrderItemId()).userId(o12.getUserId())
                    .reason("Đổi màu sắc khác").customerNote("Muốn đổi sang phối màu đen trắng.")
                    .imageUrls(images).status(ReturnStatus.APPROVED)
                    .staffNote("Hàng còn nguyên tag").managerNote("Đồng ý nhận lại hàng trong 7 ngày.")
                    .refundStatus(RefundStatus.NOT_REQUIRED).refundAmount(item.getLineTotal())
                    .refundBankName("MB Bank").refundAccountNumber("090123456789").refundAccountHolder("NGUYEN MINH ANH")
                    .shipBackDeadlineAt(now.plusDays(5)).staffConfirmedAt(now.minusDays(2))
                    .approvedAt(now.minusDays(1)).createdAt(now.minusDays(2)).updatedAt(now.minusDays(1)).build());
        }
        // 3: RECEIVED (customer2)
        Order o13 = orderByCode.get(SEED_ORDER_PREFIX + "013");
        if (o13 != null && !o13.getItems().isEmpty()) {
            OrderItem item = o13.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o13.getOrderId()).orderItemId(item.getOrderItemId()).userId(o13.getUserId())
                    .reason("Không vừa form chân").customerNote("Đã gửi bưu điện hoàn hàng về kho.")
                    .imageUrls(images).status(ReturnStatus.RECEIVED)
                    .itemCondition(ReturnItemCondition.GOOD).receiveNote("Hộp và tem nguyên vẹn, đã nhập lại kho.")
                    .maxRefundAmount(item.getLineTotal()).refundAmount(item.getLineTotal())
                    .refundStatus(RefundStatus.NOT_REQUIRED)
                    .refundBankName("ACB").refundAccountNumber("123456789").refundAccountHolder("TRAN QUOC BAO")
                    .approvedAt(now.minusDays(3)).receivedAt(now.minusHours(6))
                    .createdAt(now.minusDays(4)).updatedAt(now.minusHours(6)).build());
        }
        // 4: REFUND_PENDING (customer1 — stale >3 days)
        Order o14 = orderByCode.get(SEED_ORDER_PREFIX + "014");
        if (o14 != null && !o14.getItems().isEmpty()) {
            OrderItem item = o14.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o14.getOrderId()).orderItemId(item.getOrderItemId()).userId(o14.getUserId())
                    .reason("Sản phẩm giao sai size 41 thay vì 42").customerNote("Cần hoàn tiền qua tài khoản ngân hàng.")
                    .imageUrls(images).status(ReturnStatus.REFUND_PENDING).refundStatus(RefundStatus.PENDING)
                    .itemCondition(ReturnItemCondition.GOOD).receiveNote("Kho xác nhận nhận đúng hàng nguyên vẹn.")
                    .maxRefundAmount(item.getLineTotal()).refundAmount(item.getLineTotal())
                    .refundNote("Chờ kế toán chuyển khoản hoàn tiền.")
                    .refundBankName("VietinBank").refundAccountNumber("108001234567").refundAccountHolder("NGUYEN MINH ANH")
                    .refundRequestedBy(managerId).refundRequestedAt(now.minusDays(4))
                    .approvedAt(now.minusDays(6)).receivedAt(now.minusDays(4))
                    .createdAt(now.minusDays(7)).updatedAt(now.minusDays(4)).build());
        }
        // 5: REFUNDED (customer1)
        Order o10 = orderByCode.get(SEED_ORDER_PREFIX + "010");
        if (o10 != null && !o10.getItems().isEmpty()) {
            OrderItem item = o10.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o10.getOrderId()).orderItemId(item.getOrderItemId()).userId(o10.getUserId())
                    .reason("Đế giày có vết xước khi nhận").customerNote("Đã gửi lại hàng theo hướng dẫn.")
                    .imageUrls(images).status(ReturnStatus.REFUNDED).refundStatus(RefundStatus.COMPLETED)
                    .itemCondition(ReturnItemCondition.GOOD).receiveNote("Đã nhận hàng hoàn, nhập kho GOOD.")
                    .maxRefundAmount(item.getLineTotal()).refundAmount(o10.getGrandTotal())
                    .refundMethod(RefundMethod.BANK_TRANSFER).refundTransactionRef("VCB-REF-20261110")
                    .refundNote("Đã hoàn tiền 100% qua Vietcombank.")
                    .refundBankName("Vietcombank").refundAccountNumber("0071001234567").refundAccountHolder("NGUYEN MINH ANH")
                    .refundRequestedBy(managerId).refundedBy(managerId)
                    .approvedAt(now.minusDays(5)).receivedAt(now.minusDays(3))
                    .refundRequestedAt(now.minusDays(2)).refundedAt(now.minusDays(1))
                    .refundCompletedAt(now.minusDays(1)).closedAt(now.minusDays(1))
                    .createdAt(now.minusDays(6)).updatedAt(now.minusDays(1)).build());
        }
        // 6: REJECTED (customer2)
        Order o15 = orderByCode.get(SEED_ORDER_PREFIX + "015");
        if (o15 != null && !o15.getItems().isEmpty()) {
            OrderItem item = o15.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o15.getOrderId()).orderItemId(item.getOrderItemId()).userId(o15.getUserId())
                    .reason("Đổi ý không muốn dùng nữa").customerNote("Đã đi thử ngoài trời 1 lần.")
                    .imageUrls(images).status(ReturnStatus.REJECTED).refundStatus(RefundStatus.NOT_REQUIRED)
                    .rejectedReason("Đế giày có dấu hiệu đã sử dụng ngoài trời, không đủ điều kiện đổi trả.")
                    .rejectedAt(now.minusDays(2)).createdAt(now.minusDays(3)).updatedAt(now.minusDays(2)).build());
        }
        // 7: PENDING (customer1 — on SO-DEMO-016)
        Order o16 = orderByCode.get(SEED_ORDER_PREFIX + "016");
        if (o16 != null && !o16.getItems().isEmpty()) {
            OrderItem item = o16.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o16.getOrderId()).orderItemId(item.getOrderItemId()).userId(o16.getUserId())
                    .reason("Đế hơi cứng khi chạy bộ, muốn đổi mẫu êm hơn").customerNote("Mới xỏ thử trong nhà 5 phút, còn đủ hộp và tag.")
                    .imageUrls(images).status(ReturnStatus.PENDING).refundStatus(RefundStatus.NOT_REQUIRED)
                    .refundAmount(item.getLineTotal()).refundBankName("Vietcombank")
                    .refundAccountNumber("0071001234567").refundAccountHolder("NGUYEN MINH ANH")
                    .createdAt(now.minusHours(7)).updatedAt(now.minusHours(7)).build());
        }
        // 8: APPROVED (customer1 — on SO-DEMO-006)
        Order o6 = orderByCode.get(SEED_ORDER_PREFIX + "006");
        if (o6 != null && !o6.getItems().isEmpty()) {
            OrderItem item = o6.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o6.getOrderId()).orderItemId(item.getOrderItemId()).userId(o6.getUserId())
                    .reason("Muốn đổi lên size 43 cho thoải mái").customerNote("Size 42 hơi ôm phần mu bàn chân.")
                    .imageUrls(images).status(ReturnStatus.APPROVED)
                    .staffNote("Xác nhận còn đủ phụ kiện dây dự phòng").managerNote("Chấp thuận đổi size miễn phí.")
                    .refundStatus(RefundStatus.NOT_REQUIRED).refundAmount(item.getLineTotal())
                    .refundBankName("MB Bank").refundAccountNumber("090123456789").refundAccountHolder("NGUYEN MINH ANH")
                    .shipBackDeadlineAt(now.plusDays(6)).staffConfirmedAt(now.minusHours(15))
                    .approvedAt(now.minusHours(3)).createdAt(now.minusDays(1)).updatedAt(now.minusHours(3)).build());
        }
        // 9: REJECTED (customer1 — on SO-DEMO-007)
        Order o7 = orderByCode.get(SEED_ORDER_PREFIX + "007");
        if (o7 != null && !o7.getItems().isEmpty()) {
            OrderItem item = o7.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o7.getOrderId()).orderItemId(item.getOrderItemId()).userId(o7.getUserId())
                    .reason("Muốn đổi sang phối màu khác").customerNote("Mình muốn đổi sang bản màu đen.")
                    .imageUrls(images).status(ReturnStatus.REJECTED).refundStatus(RefundStatus.NOT_REQUIRED)
                    .rejectedReason("Đơn hàng đã quá hạn hỗ trợ đổi trả 7 ngày kể từ khi hoàn tất.")
                    .rejectedAt(now.minusDays(3)).createdAt(now.minusDays(4)).updatedAt(now.minusDays(3)).build());
        }
        // 10: CLOSED (customer1 — on SO-DEMO-017)
        Order o17 = orderByCode.get(SEED_ORDER_PREFIX + "017");
        if (o17 != null && !o17.getItems().isEmpty()) {
            OrderItem item = o17.getItems().get(0);
            returns.add(ReturnRequest.builder()
                    .orderId(o17.getOrderId()).orderItemId(item.getOrderItemId()).userId(o17.getUserId())
                    .reason("Hộp giày bị móp nhẹ khi vận chuyển, đổi hộp mới").customerNote("Đã nhận hỗ trợ đổi sản phẩm hoàn chỉnh.")
                    .imageUrls(images).status(ReturnStatus.CLOSED).refundStatus(RefundStatus.COMPLETED)
                    .itemCondition(ReturnItemCondition.GOOD).receiveNote("Đã hoàn tất kiểm tra và đóng hồ sơ.")
                    .maxRefundAmount(item.getLineTotal()).refundAmount(item.getLineTotal())
                    .refundMethod(RefundMethod.BANK_TRANSFER).refundTransactionRef("VCB-REF-20261105")
                    .refundNote("Hoàn tất đối soát và đóng yêu cầu.")
                    .refundBankName("Vietcombank").refundAccountNumber("0071001234567").refundAccountHolder("NGUYEN MINH ANH")
                    .refundRequestedBy(managerId).refundedBy(managerId)
                    .approvedAt(now.minusDays(9)).receivedAt(now.minusDays(7))
                    .refundRequestedAt(now.minusDays(6)).refundedAt(now.minusDays(5))
                    .refundCompletedAt(now.minusDays(5)).closedAt(now.minusDays(5))
                    .createdAt(now.minusDays(10)).updatedAt(now.minusDays(5)).build());
        }
        return returns;
    }
}
