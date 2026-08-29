package www.modules.cart;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.exception.BadRequestException;
import www.modules.cart.model.Cart;
import www.modules.cart.repository.CartRepository;
import www.modules.cart.service.CartService;
import www.modules.cart.service.GuestCartMergeService;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.CartStatus;
import www.modules.inventory.service.InventoryService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock private CartRepository cartRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private ProductRepository productRepository;
    @Mock private InventoryService inventoryService;
    @Mock private GuestCartMergeService guestCartMergeService;

    @InjectMocks
    private CartService cartService;

    @Test
    void activeGuestCart_requiresSessionId() {
        assertThrows(BadRequestException.class, () -> cartService.activeGuestCart(null));
        assertThrows(BadRequestException.class, () -> cartService.activeGuestCart("  "));
    }

    @Test
    void resolveCart_prefersUserOverGuest() {
        Cart userCart = Cart.builder().userId("u1").cartId("c-user").build();
        when(cartRepository.findFirstByUserIdAndStatus("u1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(userCart));

        Cart resolved = cartService.resolveCart("u1", "guest-123");
        assertEquals("c-user", resolved.getCartId());
        verify(cartRepository, never()).findFirstByGuestSessionIdAndStatus(anyString(), any());
    }

    @Test
    void resolveCart_usesGuestWhenNoUser() {
        Cart guestCart = Cart.builder().guestSessionId("g1").cartId("c-guest").build();
        when(cartRepository.findFirstByGuestSessionIdAndStatus("g1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(guestCart));

        Cart resolved = cartService.resolveCart(null, "g1");
        assertEquals("c-guest", resolved.getCartId());
    }

    @Test
    void mergeGuestCart_delegatesToMergeService() {
        cartService.mergeGuestCartIntoUser("g1", "u1");
        verify(guestCartMergeService).mergeGuestCartIntoUser("g1", "u1");
    }
}
