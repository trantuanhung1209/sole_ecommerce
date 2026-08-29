package www.modules.cart.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public Cart activeCart(String userId) {
        return cartRepository.findFirstByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    return cartRepository.save(Cart.builder()
                            .userId(userId)
                            .createdAt(now)
                            .updatedAt(now)
                            .build());
                });
    }

    public CartView toView(Cart cart) {
        CartView view = new CartView();
        view.setCartId(cart.getCartId());
        view.setUserId(cart.getUserId());
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
        productRepository.findById(variant.getProductId())
                .map(Product::getName)
                .ifPresent(view::setProductName);
    }

    public Cart addItem(String userId, String variantId, int quantity) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId));
        if (variant.getStatus() != VariantStatus.ACTIVE) {
            throw new BadRequestException("Variant is inactive");
        }
        if (inventoryService.getByVariant(variantId).getAvailable() < quantity) {
            throw new BadRequestException("Not enough stock");
        }

        Cart cart = activeCart(userId);
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

    public Cart updateItem(String userId, String cartItemId, int quantity) {
        Cart cart = activeCart(userId);
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

    public Cart removeItem(String userId, String cartItemId) {
        Cart cart = activeCart(userId);
        cart.getItems().removeIf(item -> item.getCartItemId().equals(cartItemId));
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart clear(String userId) {
        Cart cart = activeCart(userId);
        cart.getItems().clear();
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public void markCheckedOut(Cart cart) {
        cart.setStatus(CartStatus.CHECKED_OUT);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    public CartValidationResult validate(String userId) {
        Cart cart = activeCart(userId);
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
