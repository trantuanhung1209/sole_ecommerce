package www.modules.cart.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.modules.cart.model.Cart;
import www.modules.cart.model.CartItem;
import www.modules.cart.repository.CartRepository;
import www.modules.common.EcommerceEnums.CartStatus;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GuestCartMergeService {
    private final CartRepository cartRepository;

    @Transactional
    public void mergeGuestCartIntoUser(String guestSessionId, String userId) {
        if (guestSessionId == null || guestSessionId.isBlank() || userId == null || userId.isBlank()) {
            return;
        }
        Optional<Cart> guestOpt = cartRepository.findFirstByGuestSessionIdAndStatus(guestSessionId, CartStatus.ACTIVE);
        if (guestOpt.isEmpty() || guestOpt.get().getItems().isEmpty()) {
            return;
        }
        Cart guestCart = guestOpt.get();
        Cart userCart = cartRepository.findFirstByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    return cartRepository.save(Cart.builder()
                            .userId(userId)
                            .createdAt(now)
                            .updatedAt(now)
                            .build());
                });

        for (CartItem guestItem : guestCart.getItems()) {
            CartItem existing = userCart.getItems().stream()
                    .filter(item -> item.getVariantId().equals(guestItem.getVariantId()))
                    .findFirst()
                    .orElse(null);
            if (existing == null) {
                userCart.getItems().add(CartItem.builder()
                        .variantId(guestItem.getVariantId())
                        .quantity(guestItem.getQuantity())
                        .priceSnapshot(guestItem.getPriceSnapshot())
                        .addedAt(LocalDateTime.now())
                        .build());
            } else {
                existing.setQuantity(existing.getQuantity() + guestItem.getQuantity());
                existing.setPriceSnapshot(guestItem.getPriceSnapshot());
            }
        }
        userCart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(userCart);
        guestCart.setStatus(CartStatus.CHECKED_OUT);
        guestCart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(guestCart);
    }
}
