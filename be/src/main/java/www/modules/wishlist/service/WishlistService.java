package www.modules.wishlist.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import www.modules.catalog.service.CatalogService;
import www.modules.wishlist.model.WishlistItem;
import www.modules.wishlist.repository.WishlistRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final CatalogService catalogService;

    public List<WishlistItem> mine(String userId) {
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public WishlistItem add(String userId, String productId) {
        catalogService.getProduct(productId);
        return wishlistRepository.findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> {
                    try {
                        return wishlistRepository.save(WishlistItem.builder()
                                .userId(userId)
                                .productId(productId)
                                .createdAt(LocalDateTime.now())
                                .build());
                    } catch (DuplicateKeyException ignored) {
                        return wishlistRepository.findByUserIdAndProductId(userId, productId).orElseThrow();
                    }
                });
    }

    public void remove(String userId, String productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }
}
