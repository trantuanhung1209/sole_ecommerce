package www.modules.checkout.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.BadRequestException;
import www.exception.NotFoundException;
import www.modules.addresses.model.Address;
import www.modules.addresses.service.AddressService;
import www.modules.cart.model.Cart;
import www.modules.cart.model.CartItem;
import www.modules.cart.service.CartService;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.BrandRepository;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.checkout.dto.CheckoutDtos.CheckoutPreview;
import www.modules.checkout.dto.CheckoutDtos.CheckoutRequest;
import www.modules.inventory.service.InventoryService;
import www.modules.notifications.service.NotificationService;
import www.modules.common.EcommerceEnums.NotificationType;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.orders.service.OrderService;
import www.modules.payments.dto.PaymentDtos.PaymentCheckoutResponse;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.promotions.PromotionEnums.CouponType;
import www.modules.promotions.dto.PromotionDtos.CouponValidationResult;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.service.CouponValidator;
import www.modules.promotions.service.PromotionService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckoutService {
    private final CartService cartService;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final InventoryService inventoryService;
    private final OrderService orderService;
    private final EcommercePaymentService paymentService;
    private final NotificationService notificationService;
    private final AddressService addressService;
    private final ShippingFeeCalculator shippingFeeCalculator;
    private final VatCalculator vatCalculator;
    private final CouponValidator couponValidator;
    private final PromotionService promotionService;
    private final ObjectMapper objectMapper;

    public CheckoutPreview preview(String userId) {
        return preview(userId, null);
    }

    public CheckoutPreview preview(String userId, String couponCode) {
        Cart cart = cartService.activeCart(userId);
        double subtotal = computeSubtotal(cart);
        Pricing pricing = computePricing(userId, subtotal, couponCode);
        CheckoutPreview preview = new CheckoutPreview();
        preview.setItemCount(cart.getItems().size());
        preview.setSubtotal(subtotal);
        preview.setDiscountTotal(pricing.discountTotal());
        preview.setShippingFee(pricing.shippingFee());
        preview.setTaxTotal(pricing.taxTotal());
        preview.setGrandTotal(pricing.grandTotal());
        preview.setCouponCode(couponCode);
        preview.setCouponValid(pricing.couponValid());
        preview.setCouponMessage(pricing.couponMessage());
        return preview;
    }

    @Transactional
    public PaymentCheckoutResponse checkout(String userId, CheckoutRequest request) {
        Cart cart = cartService.activeCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        var validation = cartService.validate(userId);
        if (!validation.isValid()) {
            throw new BadRequestException("Cart validation failed: "
                    + validation.getIssues().stream()
                    .map(i -> i.getMessage())
                    .reduce((a, b) -> a + "; " + b)
                    .orElse("invalid items"));
        }

        String orderId = UUID.randomUUID().toString();
        String orderCode = orderService.nextOrderCode();

        try {
            for (CartItem cartItem : cart.getItems()) {
                inventoryService.reserve(orderId, cartItem.getVariantId(), cartItem.getQuantity());
            }
        } catch (RuntimeException e) {
            inventoryService.releaseOrderReservations(orderId);
            throw e;
        }

        Address address = addressService.getOwned(userId, request.getAddressId());
        String addressSnapshot = toAddressSnapshot(address);
        double subtotal = computeSubtotal(cart);
        Pricing pricing = computePricing(userId, subtotal, request.getCouponCode());
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank() && !pricing.couponValid()) {
            inventoryService.releaseOrderReservations(orderId);
            throw new BadRequestException(pricing.couponMessage());
        }

        try {
            Order order = Order.builder()
                    .orderId(orderId)
                    .orderCode(orderCode)
                    .userId(userId)
                    .shippingAddressSnapshot(addressSnapshot)
                    .customerNote(request.getCustomerNote())
                    .couponCode(pricing.appliedCouponCode())
                    .items(new ArrayList<>())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            for (CartItem cartItem : cart.getItems()) {
                ProductVariant variant = variantRepository.findById(cartItem.getVariantId())
                        .orElseThrow(() -> new NotFoundException("Variant not found: " + cartItem.getVariantId()));
                Product product = productRepository.findById(variant.getProductId())
                        .orElseThrow(() -> new NotFoundException("Product not found: " + variant.getProductId()));
                String brandName = null;
                if (product.getBrandId() != null) {
                    brandName = brandRepository.findById(product.getBrandId())
                            .map(brand -> brand.getName())
                            .orElse(null);
                }
                double lineTotal = variant.getPrice() * cartItem.getQuantity();
                String image = !variant.getImageUrls().isEmpty()
                        ? variant.getImageUrls().get(0)
                        : (!product.getImageUrls().isEmpty() ? product.getImageUrls().get(0) : null);

                order.getItems().add(OrderItem.builder()
                        .orderItemId(UUID.randomUUID().toString())
                        .productId(product.getProductId())
                        .variantId(variant.getVariantId())
                        .skuSnapshot(variant.getSku())
                        .productNameSnapshot(product.getName())
                        .brandNameSnapshot(brandName)
                        .sizeSnapshot(variant.getSize())
                        .colorSnapshot(variant.getColorName())
                        .imageSnapshot(image)
                        .unitPrice(variant.getPrice())
                        .quantity(cartItem.getQuantity())
                        .lineTotal(lineTotal)
                        .build());
            }

            order.setSubtotal(subtotal);
            order.setDiscountTotal(pricing.discountTotal());
            order.setShippingFee(pricing.shippingFee());
            order.setTaxTotal(pricing.taxTotal());
            order.setGrandTotal(pricing.grandTotal());
            Order savedOrder = orderService.save(order);

            if (pricing.coupon() != null) {
                promotionService.recordUsage(pricing.coupon(), userId, savedOrder.getOrderId(), pricing.discountTotal());
            }

            cartService.markCheckedOut(cart);
            notificationService.create(
                    userId,
                    NotificationType.ORDER_CREATED,
                    "Đơn hàng đã tạo",
                    "Đơn " + savedOrder.getOrderCode() + " đang chờ thanh toán",
                    "/orders/" + savedOrder.getOrderId());
            notificationService.notifyStaff(
                    NotificationType.STAFF_NEW_ORDER,
                    "Đơn hàng mới",
                    "Đơn " + savedOrder.getOrderCode() + " cần xử lý",
                    "/admin/orders");
            return paymentService.createPayment(savedOrder);
        } catch (RuntimeException e) {
            inventoryService.releaseOrderReservations(orderId);
            throw e;
        }
    }

    private double computeSubtotal(Cart cart) {
        double subtotal = 0;
        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = variantRepository.findById(cartItem.getVariantId())
                    .orElseThrow(() -> new NotFoundException("Variant not found: " + cartItem.getVariantId()));
            subtotal += variant.getPrice() * cartItem.getQuantity();
        }
        return subtotal;
    }

    private Pricing computePricing(String userId, double subtotal, String couponCode) {
        double discountTotal = 0;
        double shippingFee = shippingFeeCalculator.calculate(subtotal);
        boolean couponValid = false;
        String couponMessage = null;
        String appliedCouponCode = null;
        Coupon coupon = null;

        if (couponCode != null && !couponCode.isBlank()) {
            CouponValidationResult result = couponValidator.validate(couponCode, userId, subtotal);
            couponValid = result.isValid();
            couponMessage = result.getMessage();
            if (result.isValid()) {
                appliedCouponCode = result.getCode();
                discountTotal = result.getDiscountAmount();
                if (result.getType() == CouponType.FREE_SHIPPING) {
                    shippingFee = 0;
                }
                coupon = couponValidator.requireValid(couponCode, userId, subtotal);
            }
        }

        double taxTotal = vatCalculator.calculateTax(subtotal, discountTotal);
        double grandTotal = Math.max(0, subtotal - discountTotal + shippingFee + taxTotal);
        return new Pricing(discountTotal, shippingFee, taxTotal, grandTotal, couponValid, couponMessage,
                appliedCouponCode, coupon);
    }

    private String toAddressSnapshot(Address address) {
        try {
            return objectMapper.writeValueAsString(address);
        } catch (JsonProcessingException e) {
            return address.getRecipientName() + ", " + address.getPhone() + ", "
                    + address.getLine1() + ", " + address.getCity();
        }
    }

    private record Pricing(
            double discountTotal,
            double shippingFee,
            double taxTotal,
            double grandTotal,
            boolean couponValid,
            String couponMessage,
            String appliedCouponCode,
            Coupon coupon) {}
}
