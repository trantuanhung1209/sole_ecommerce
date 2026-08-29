package www.modules.cart.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import www.modules.cart.support.GuestCartSupport;
import www.security.CustomUserDetailsService.UserPrincipal;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;
    private final GuestCartSupport guestCartSupport;

    @GetMapping
    public ResponseEntity<ApiResponse<CartView>> get(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        CartContext ctx = resolveContext(authentication, request, response);
        return ResponseEntity.ok(ApiResponse.success(
                cartService.toView(cartService.resolveCart(ctx.userId(), ctx.guestSessionId()))));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartView>> add(
            @Valid @RequestBody AddCartItemRequest body,
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        CartContext ctx = resolveContext(authentication, request, response);
        return ResponseEntity.ok(ApiResponse.success("Added to cart",
                cartService.toView(cartService.addItem(ctx.userId(), ctx.guestSessionId(),
                        body.getVariantId(), body.getQuantity()))));
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartView>> update(
            @PathVariable String cartItemId,
            @Valid @RequestBody UpdateCartItemRequest body,
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        CartContext ctx = resolveContext(authentication, request, response);
        return ResponseEntity.ok(ApiResponse.success("Cart updated",
                cartService.toView(cartService.updateItem(ctx.userId(), ctx.guestSessionId(),
                        cartItemId, body.getQuantity()))));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartView>> remove(
            @PathVariable String cartItemId,
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        CartContext ctx = resolveContext(authentication, request, response);
        return ResponseEntity.ok(ApiResponse.success("Cart item removed",
                cartService.toView(cartService.removeItem(ctx.userId(), ctx.guestSessionId(), cartItemId))));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartView>> clear(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        CartContext ctx = resolveContext(authentication, request, response);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared",
                cartService.toView(cartService.clear(ctx.userId(), ctx.guestSessionId()))));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CartValidationResult>> validate(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        CartContext ctx = resolveContext(authentication, request, response);
        return ResponseEntity.ok(ApiResponse.success(
                cartService.validate(ctx.userId(), ctx.guestSessionId())));
    }

    private CartContext resolveContext(Authentication authentication, HttpServletRequest request,
            HttpServletResponse response) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return new CartContext(principal.getId(), null);
        }
        String guestId = guestCartSupport.ensureGuestSessionId(request, response);
        return new CartContext(null, guestId);
    }

    private record CartContext(String userId, String guestSessionId) {}
}
