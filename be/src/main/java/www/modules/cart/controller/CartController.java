package www.modules.cart.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.cart.dto.CartDtos.AddCartItemRequest;
import www.modules.cart.dto.CartDtos.CartValidationResult;
import www.modules.cart.dto.CartDtos.CartView;
import www.modules.cart.dto.CartDtos.UpdateCartItemRequest;
import www.modules.cart.service.CartService;
import www.security.CustomUserDetailsService.UserPrincipal;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartView>> get(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                cartService.toView(cartService.activeCart(userId(authentication)))));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartView>> add(@Valid @RequestBody AddCartItemRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Added to cart",
                cartService.toView(cartService.addItem(userId(authentication), request.getVariantId(), request.getQuantity()))));
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartView>> update(
            @PathVariable String cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Cart updated",
                cartService.toView(cartService.updateItem(userId(authentication), cartItemId, request.getQuantity()))));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartView>> remove(@PathVariable String cartItemId, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Cart item removed",
                cartService.toView(cartService.removeItem(userId(authentication), cartItemId))));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartView>> clear(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Cart cleared",
                cartService.toView(cartService.clear(userId(authentication)))));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CartValidationResult>> validate(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(cartService.validate(userId(authentication))));
    }

    private String userId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getId();
    }
}
