package www.modules.cart.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.BadRequestException;
import www.exception.NotFoundException;
import www.modules.cart.dto.CartDtos.CartValidationIssue;
import www.modules.cart.dto.CartDtos.CartValidationResult;
import www.modules.cart.dto.CartDtos.CartItemView;
import www.modules.cart.dto.CartDtos.CartView;
import www.modules.cart.model.Cart;
import www.modules.cart.model.CartItem;
import www.modules.cart.repository.CartRepository;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.CartStatus;
import www.modules.common.EcommerceEnums.VariantStatus;
import www.modules.inventory.service.InventoryService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final GuestCartMergeService guestCartMergeService;

    public Cart activeCart(String userId) {
        return cartRepository.findFirstByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> createUserCart(userId));
    }

    public Cart activeGuestCart(String guestSessionId) {
        if (guestSessionId == null || guestSessionId.isBlank()) {
            throw new BadRequestException("Guest session required");
        }
        return cartRepository.findFirstByGuestSessionIdAndStatus(guestSessionId, CartStatus.ACTIVE)
                .orElseGet(() -> createGuestCart(guestSessionId));
    }

    public Cart resolveCart(String userId, String guestSessionId) {
        if (userId != null && !userId.isBlank()) {
            return activeCart(userId);
        }
        return activeGuestCart(guestSessionId);
    }

    @Transactional
    public void mergeGuestCartIntoUser(String guestSessionId, String userId) {
        guestCartMergeService.mergeGuestCartIntoUser(guestSessionId, userId);
    }

    private Cart createUserCart(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return cartRepository.save(Cart.builder()
                .userId(userId)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    private Cart createGuestCart(String guestSessionId) {
        LocalDateTime now = LocalDateTime.now();
        return cartRepository.save(Cart.builder()
                .guestSessionId(guestSessionId)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    public CartView toView(Cart cart) {
        CartView view = new CartView();
        view.setCartId(cart.getCartId());
        view.setUserId(cart.getUserId());
        view.setGuestSessionId(cart.getGuestSessionId());
        view.setStatus(cart.getStatus());
        view.setCreatedAt(cart.getCreatedAt());
        view.setUpdatedAt(cart.getUpdatedAt());
        view.setItems(cart.getItems().stream().map(this::toItemView).toList());
        return view;
    }

    private CartItemView toItemView(CartItem item) {
        CartItemView view = new CartItemView();
        view.setCartItemId(item.getCartItemId());
        view.setVariantId(item.getVariantId());
        view.setQuantity(item.getQuantity());
        view.setPriceSnapshot(item.getPriceSnapshot());
        view.setAddedAt(item.getAddedAt());
        variantRepository.findById(item.getVariantId()).ifPresent(variant -> enrichItemView(view, variant));
        return view;
    }

    private void enrichItemView(CartItemView view, ProductVariant variant) {
        view.setSku(variant.getSku());
        view.setSize(variant.getSize());
        view.setColorName(variant.getColorName());
        if (variant.getImageUrls() != null && !variant.getImageUrls().isEmpty()) {
            view.setImageUrl(variant.getImageUrls().get(0));
        }
        productRepository.findById(variant.getProductId()).ifPresent(product -> {
            view.setProductName(product.getName());
            view.setProductId(product.getProductId());
            view.setProductSlug(product.getSlug());
        });
    }

    public Cart addItem(String userId, String guestSessionId, String variantId, int quantity) {
        return addItem(resolveCart(userId, guestSessionId), variantId, quantity);
    }

    public Cart addItem(String userId, String variantId, int quantity) {
        return addItem(activeCart(userId), variantId, quantity);
    }

    private Cart addItem(Cart cart, String variantId, int quantity) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId));
        if (variant.getStatus() != VariantStatus.ACTIVE) {
            throw new BadRequestException("Variant is inactive");
        }
        if (inventoryService.getByVariant(variantId).getAvailable() < quantity) {
            throw new BadRequestException("Not enough stock");
        }

        CartItem existing = cart.getItems().stream()
                .filter(item -> item.getVariantId().equals(variantId))
                .findFirst()
                .orElse(null);
        if (existing == null) {
            cart.getItems().add(CartItem.builder()
                    .variantId(variantId)
                    .quantity(quantity)
                    .priceSnapshot(variant.getPrice())
                    .addedAt(LocalDateTime.now())
                    .build());
        } else {
            existing.setQuantity(existing.getQuantity() + quantity);
            existing.setPriceSnapshot(variant.getPrice());
        }
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart updateItem(String userId, String guestSessionId, String cartItemId, int quantity) {
        return updateItem(resolveCart(userId, guestSessionId), cartItemId, quantity);
    }

    public Cart updateItem(String userId, String cartItemId, int quantity) {
        return updateItem(activeCart(userId), cartItemId, quantity);
    }

    private Cart updateItem(Cart cart, String cartItemId, int quantity) {
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getCartItemId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Cart item not found"));
        if (inventoryService.getByVariant(item.getVariantId()).getAvailable() < quantity) {
            throw new BadRequestException("Not enough stock");
        }
        item.setQuantity(quantity);
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart removeItem(String userId, String guestSessionId, String cartItemId) {
        return removeItem(resolveCart(userId, guestSessionId), cartItemId);
    }

    public Cart removeItem(String userId, String cartItemId) {
        return removeItem(activeCart(userId), cartItemId);
    }

    private Cart removeItem(Cart cart, String cartItemId) {
        cart.getItems().removeIf(item -> item.getCartItemId().equals(cartItemId));
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart clear(String userId, String guestSessionId) {
        return clear(resolveCart(userId, guestSessionId));
    }

    public Cart clear(String userId) {
        return clear(activeCart(userId));
    }

    private Cart clear(Cart cart) {
        cart.getItems().clear();
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public void markCheckedOut(Cart cart) {
        cart.setStatus(CartStatus.CHECKED_OUT);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    public CartValidationResult validate(String userId, String guestSessionId) {
        return validate(resolveCart(userId, guestSessionId));
    }

    public CartValidationResult validate(String userId) {
        return validate(activeCart(userId));
    }

    private CartValidationResult validate(Cart cart) {
        CartValidationResult result = new CartValidationResult();
        result.setValid(true);
        for (CartItem item : cart.getItems()) {
            try {
                ProductVariant variant = variantRepository.findById(item.getVariantId())
                        .orElseThrow(() -> new NotFoundException("Variant not found"));
                if (variant.getStatus() != VariantStatus.ACTIVE) {
                    result.setValid(false);
                    result.getIssues().add(issue(item, "Variant is inactive"));
                    continue;
                }
                if (inventoryService.getByVariant(item.getVariantId()).getAvailable() < item.getQuantity()) {
                    result.setValid(false);
                    result.getIssues().add(issue(item, "Not enough stock"));
                }
            } catch (NotFoundException e) {
                result.setValid(false);
                result.getIssues().add(issue(item, e.getMessage()));
            }
        }
        return result;
    }

    private CartValidationIssue issue(CartItem item, String message) {
        CartValidationIssue issue = new CartValidationIssue();
        issue.setCartItemId(item.getCartItemId());
        issue.setVariantId(item.getVariantId());
        issue.setMessage(message);
        return issue;
    }
}
