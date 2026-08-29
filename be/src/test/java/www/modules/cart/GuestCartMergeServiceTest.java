package www.modules.cart;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.cart.model.Cart;
import www.modules.cart.model.CartItem;
import www.modules.cart.repository.CartRepository;
import www.modules.cart.service.GuestCartMergeService;
import www.modules.common.EcommerceEnums.CartStatus;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GuestCartMergeServiceTest {

    @Mock
    private CartRepository cartRepository;

    @InjectMocks
    private GuestCartMergeService mergeService;

    @Test
    void merge_noOpWhenGuestSessionBlank() {
        mergeService.mergeGuestCartIntoUser("", "u1");
        verifyNoInteractions(cartRepository);
    }

    @Test
    void merge_noOpWhenGuestCartEmpty() {
        Cart guest = Cart.builder().guestSessionId("g1").items(new ArrayList<>()).build();
        when(cartRepository.findFirstByGuestSessionIdAndStatus("g1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(guest));
        mergeService.mergeGuestCartIntoUser("g1", "u1");
        verify(cartRepository, never()).save(any());
    }

    @Test
    void merge_createsUserCartAndCombinesQuantity() {
        Cart guest = Cart.builder()
                .guestSessionId("g1")
                .status(CartStatus.ACTIVE)
                .items(new ArrayList<>(java.util.List.of(
                        CartItem.builder().variantId("v1").quantity(2).priceSnapshot(100.0).build())))
                .build();
        Cart user = Cart.builder()
                .userId("u1")
                .status(CartStatus.ACTIVE)
                .items(new ArrayList<>(java.util.List.of(
                        CartItem.builder().variantId("v1").quantity(1).priceSnapshot(90.0).build(),
                        CartItem.builder().variantId("v2").quantity(1).priceSnapshot(50.0).build())))
                .build();

        when(cartRepository.findFirstByGuestSessionIdAndStatus("g1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(guest));
        when(cartRepository.findFirstByUserIdAndStatus("u1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(user));
        when(cartRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mergeService.mergeGuestCartIntoUser("g1", "u1");

        ArgumentCaptor<Cart> saved = ArgumentCaptor.forClass(Cart.class);
        verify(cartRepository, times(2)).save(saved.capture());
        Cart savedUser = saved.getAllValues().get(0);
        Cart savedGuest = saved.getAllValues().get(1);

        assertEquals(3, savedUser.getItems().stream()
                .filter(i -> "v1".equals(i.getVariantId()))
                .findFirst()
                .orElseThrow()
                .getQuantity());
        assertEquals(100.0, savedUser.getItems().stream()
                .filter(i -> "v1".equals(i.getVariantId()))
                .findFirst()
                .orElseThrow()
                .getPriceSnapshot());
        assertEquals(2, savedUser.getItems().size());
        assertEquals(CartStatus.CHECKED_OUT, savedGuest.getStatus());
    }

    @Test
    void merge_addsNewVariantWhenNotInUserCart() {
        Cart guest = Cart.builder()
                .guestSessionId("g1")
                .items(new ArrayList<>(java.util.List.of(
                        CartItem.builder().variantId("v9").quantity(1).priceSnapshot(200.0).build())))
                .build();
        Cart user = Cart.builder().userId("u1").items(new ArrayList<>()).build();

        when(cartRepository.findFirstByGuestSessionIdAndStatus("g1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(guest));
        when(cartRepository.findFirstByUserIdAndStatus("u1", CartStatus.ACTIVE))
                .thenReturn(Optional.of(user));
        when(cartRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mergeService.mergeGuestCartIntoUser("g1", "u1");

        verify(cartRepository, times(2)).save(any());
        assertEquals(1, user.getItems().size());
        assertEquals("v9", user.getItems().get(0).getVariantId());
    }
}
