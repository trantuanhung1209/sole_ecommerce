package www.modules.checkout;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.exception.BadRequestException;
import www.modules.addresses.model.Address;
import www.modules.addresses.service.AddressService;
import www.modules.catalog.model.ProductVariant;
import www.modules.cart.dto.CartDtos.CartValidationResult;
import www.modules.cart.model.Cart;
import www.modules.cart.service.CartService;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.catalog.repository.BrandRepository;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock private CartService cartService;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private ProductRepository productRepository;
    @Mock private BrandRepository brandRepository;
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
                cartService, variantRepository, productRepository, brandRepository, inventoryService,
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

    @Test
    void checkout_invalidCoupon_releasesReservation() {
        Cart cart = Cart.builder().userId("u1").items(new java.util.ArrayList<>()).build();
        cart.getItems().add(www.modules.cart.model.CartItem.builder().variantId("v1").quantity(1).build());
        when(cartService.activeCart("u1")).thenReturn(cart);
        when(cartService.validate("u1")).thenReturn(new CartValidationResult() {{ setValid(true); }});
        when(variantRepository.findById("v1")).thenReturn(java.util.Optional.of(
                ProductVariant.builder().variantId("v1").price(100_000.0).build()));
        when(addressService.getOwned(eq("u1"), eq("a1"))).thenReturn(Address.builder().addressId("a1").build());

        www.modules.promotions.dto.PromotionDtos.CouponValidationResult invalidCoupon =
                new www.modules.promotions.dto.PromotionDtos.CouponValidationResult();
        invalidCoupon.setValid(false);
        invalidCoupon.setMessage("Mã hết hạn");
        when(couponValidator.validate(eq("EXPIRED"), eq("u1"), anyDouble())).thenReturn(invalidCoupon);

        CheckoutRequest request = new CheckoutRequest();
        request.setAddressId("a1");
        request.setCouponCode("EXPIRED");

        assertThrows(BadRequestException.class, () -> checkoutService.checkout("u1", request));
        verify(inventoryService).reserve(anyString(), eq("v1"), eq(1));
        verify(inventoryService).releaseOrderReservations(anyString());
    }
}
