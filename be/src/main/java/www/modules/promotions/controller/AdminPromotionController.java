package www.modules.promotions.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.promotions.dto.PromotionDtos.UpsertCouponRequest;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.service.PromotionService;

import java.util.List;

@RestController
@RequestMapping("/admin/promotions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SHOP_MANAGER','SUPER_ADMIN')")
public class AdminPromotionController {
    private final PromotionService promotionService;

    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<List<Coupon>>> list() {
        return ResponseEntity.ok(ApiResponse.success(promotionService.listAll()));
    }

    @PostMapping("/coupons")
    public ResponseEntity<ApiResponse<Coupon>> create(@Valid @RequestBody UpsertCouponRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Coupon created", promotionService.create(request)));
    }

    @PutMapping("/coupons/{couponId}")
    public ResponseEntity<ApiResponse<Coupon>> update(
            @PathVariable String couponId,
            @Valid @RequestBody UpsertCouponRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Coupon updated", promotionService.update(couponId, request)));
    }
}
