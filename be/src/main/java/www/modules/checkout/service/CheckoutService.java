package www.modules.checkout.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.BadRequestException;
import www.exception.NotFoundException;
import www.modules.cart.model.Cart;
import www.modules.cart.model.CartItem;
import www.modules.cart.service.CartService;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckoutService {
    private final CartService cartService;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final OrderService orderService;
    private final EcommercePaymentService paymentService;
    private final NotificationService notificationService;

    public CheckoutPreview preview(String userId) {
        Cart cart = cartService.activeCart(userId);
        double subtotal = 0;
        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = variantRepository.findById(cartItem.getVariantId())
                    .orElseThrow(() -> new NotFoundException("Variant not found: " + cartItem.getVariantId()));
            subtotal += variant.getPrice() * cartItem.getQuantity();
        }
        double shippingFee = subtotal > 0 ? 30000 : 0;
        CheckoutPreview preview = new CheckoutPreview();
        preview.setItemCount(cart.getItems().size());
        preview.setSubtotal(subtotal);
        preview.setShippingFee(shippingFee);
        preview.setGrandTotal(subtotal + shippingFee);
        return preview;
    }

    @Transactional
    public PaymentCheckoutResponse checkout(String userId, CheckoutRequest request) {
        Cart cart = cartService.activeCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        String orderCode = orderService.nextOrderCode();
        Order order = Order.builder()
                .orderCode(orderCode)
                .userId(userId)
                .shippingAddressSnapshot(request.getShippingAddress())
                .customerNote(request.getCustomerNote())
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        double subtotal = 0;
        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = variantRepository.findById(cartItem.getVariantId())
                    .orElseThrow(() -> new NotFoundException("Variant not found: " + cartItem.getVariantId()));
            Product product = productRepository.findById(variant.getProductId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + variant.getProductId()));
            double lineTotal = variant.getPrice() * cartItem.getQuantity();
            subtotal += lineTotal;
            String image = !variant.getImageUrls().isEmpty()
                    ? variant.getImageUrls().get(0)
                    : (!product.getImageUrls().isEmpty() ? product.getImageUrls().get(0) : null);

            order.getItems().add(OrderItem.builder()
                    .orderItemId(UUID.randomUUID().toString())
                    .productId(product.getProductId())
                    .variantId(variant.getVariantId())
                    .skuSnapshot(variant.getSku())
                    .productNameSnapshot(product.getName())
                    .brandNameSnapshot(product.getBrandId())
                    .sizeSnapshot(variant.getSize())
                    .colorSnapshot(variant.getColorName())
                    .imageSnapshot(image)
                    .unitPrice(variant.getPrice())
                    .quantity(cartItem.getQuantity())
                    .lineTotal(lineTotal)
                    .build());
        }

        order.setSubtotal(subtotal);
        order.setGrandTotal(subtotal + order.getShippingFee() + order.getTaxTotal() - order.getDiscountTotal());
        Order savedOrder = orderService.save(order);

        for (CartItem cartItem : cart.getItems()) {
            inventoryService.reserve(savedOrder.getOrderId(), cartItem.getVariantId(), cartItem.getQuantity());
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
    }
}
