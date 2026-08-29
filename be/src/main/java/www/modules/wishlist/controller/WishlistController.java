package www.modules.wishlist.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.wishlist.dto.WishlistDtos.WishlistRequest;
import www.modules.wishlist.model.WishlistItem;
import www.modules.wishlist.service.WishlistService;
import www.security.CustomUserDetailsService.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
public class WishlistController {
    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<List<WishlistItem>> mine(@AuthenticationPrincipal UserPrincipal user) {
        return ApiResponse.success(wishlistService.mine(user.getId()));
    }

    @PostMapping
    public ApiResponse<WishlistItem> add(@Valid @RequestBody WishlistRequest request,
                                         @AuthenticationPrincipal UserPrincipal user) {
        return ApiResponse.success("Added to wishlist", wishlistService.add(user.getId(), request.getProductId()));
    }

    @PostMapping("/{productId}")
    public ApiResponse<WishlistItem> addByPath(@PathVariable String productId,
                                               @AuthenticationPrincipal UserPrincipal user) {
        return ApiResponse.success("Added to wishlist", wishlistService.add(user.getId(), productId));
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<Void> remove(@PathVariable String productId,
                                    @AuthenticationPrincipal UserPrincipal user) {
        wishlistService.remove(user.getId(), productId);
        return ApiResponse.success("Removed from wishlist");
    }
}
