package www.modules.checkout;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.exception.BadRequestException;
import www.modules.addresses.service.AddressService;
import www.modules.cart.dto.CartDtos.CartValidationResult;
import www.modules.cart.model.Cart;
import www.modules.cart.service.CartService;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.checkout.dto.CheckoutDtos.CheckoutRequest;
import www.modules.checkout.service.CheckoutService;
import www.modules.checkout.service.ShippingFeeCalculator;
import www.modules.checkout.service.VatCalculator;
import www.modules.inventory.service.InventoryService;
import www.modules.notifications.service.NotificationService;
import www.modules.orders.service.OrderService;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.promotions.service.CouponValidator;
import www.modules.promotions.service.PromotionService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock private CartService cartService;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private ProductRepository productRepository;
    @Mock private InventoryService inventoryService;
    @Mock private OrderService orderService;
    @Mock private EcommercePaymentService paymentService;
    @Mock private NotificationService notificationService;
    @Mock private AddressService addressService;
    @Mock private ShippingFeeCalculator shippingFeeCalculator;
    @Mock private VatCalculator vatCalculator;
    @Mock private CouponValidator couponValidator;
    @Mock private PromotionService promotionService;

    @InjectMocks
    private CheckoutService checkoutService;

    @BeforeEach
    void setUp() {
        checkoutService = new CheckoutService(
                cartService, variantRepository, productRepository, inventoryService,
                orderService, paymentService, notificationService, addressService,
                shippingFeeCalculator, vatCalculator, couponValidator, promotionService,
                new ObjectMapper());
    }

    @Test
    void checkout_emptyCart_throws() {
        when(cartService.activeCart("u1")).thenReturn(Cart.builder().userId("u1").build());
        CheckoutRequest request = new CheckoutRequest();
        request.setAddressId("a1");
        assertThrows(BadRequestException.class, () -> checkoutService.checkout("u1", request));
    }

    @Test
    void checkout_invalidCart_throws() {
        Cart cart = Cart.builder().userId("u1").items(new java.util.ArrayList<>()).build();
        cart.getItems().add(www.modules.cart.model.CartItem.builder().variantId("v1").quantity(1).build());
        when(cartService.activeCart("u1")).thenReturn(cart);
        CartValidationResult invalid = new CartValidationResult();
        invalid.setValid(false);
        invalid.getIssues().add(new www.modules.cart.dto.CartDtos.CartValidationIssue() {{
            setMessage("invalid");
        }});
        when(cartService.validate("u1")).thenReturn(invalid);
        CheckoutRequest request = new CheckoutRequest();
        request.setAddressId("a1");
        assertThrows(BadRequestException.class, () -> checkoutService.checkout("u1", request));
        verify(inventoryService, never()).reserve(anyString(), anyString(), anyInt());
    }
}
