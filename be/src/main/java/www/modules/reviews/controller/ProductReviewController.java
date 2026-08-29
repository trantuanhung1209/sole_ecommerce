package www.modules.reviews.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import www.model.dto.common.PageResponse;
import www.model.dto.response.ApiResponse;
import www.modules.reviews.dto.ProductReviewDtos.*;
import www.modules.reviews.model.ProductReview;
import www.modules.reviews.service.ProductReviewService;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.util.PageUtils;

@RestController
@RequiredArgsConstructor
public class ProductReviewController {
    private final ProductReviewService reviewService;

    @GetMapping("/reviews/products/{productId}")
    public ResponseEntity<ApiResponse<PageResponse<ProductReview>>> productReviews(
            @PathVariable String productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(
                reviewService.productReviews(productId, PageRequest.of(page, size)))));
    }

    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ProductReview>>> productReviewsAlias(
            @PathVariable String productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productReviews(productId, page, size);
    }

    @GetMapping("/reviews/me")
    public ResponseEntity<ApiResponse<PageResponse<ProductReview>>> myReviews(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(
                reviewService.myReviews(user.getId(), PageRequest.of(page, size)))));
    }

    @PostMapping("/reviews/products")
    public ResponseEntity<ApiResponse<ProductReview>> create(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success("Review created", reviewService.create(user.getId(), request)));
    }

    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ProductReview>> update(
            @PathVariable String reviewId,
            @Valid @RequestBody UpdateReviewRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.update(user.getId(), reviewId, request)));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String reviewId,
            @AuthenticationPrincipal UserPrincipal user) {
        reviewService.delete(user.getId(), reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted", null));
    }

    @PostMapping("/reviews/{reviewId}/vote")
    public ResponseEntity<ApiResponse<ProductReview>> vote(
            @PathVariable String reviewId,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.vote(reviewId, user.getId())));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN') and @perm.has(authentication, 'REVIEW_MODERATE')")
    @PutMapping("/admin/reviews/{reviewId}/reply")
    public ResponseEntity<ApiResponse<ProductReview>> reply(
            @PathVariable String reviewId,
            @Valid @RequestBody ReplyReviewRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.reply(reviewId, request, user.getId())));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN') and @perm.has(authentication, 'REVIEW_MODERATE')")
    @PutMapping("/admin/reviews/{reviewId}/visibility")
    public ResponseEntity<ApiResponse<ProductReview>> visibility(
            @PathVariable String reviewId,
            @Valid @RequestBody VisibilityRequest request) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.setVisibility(reviewId, request)));
    }
}
