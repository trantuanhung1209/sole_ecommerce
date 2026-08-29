package www.modules.promotions.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.promotions.dto.PromotionDtos.CouponValidationResult;
import www.modules.promotions.dto.PromotionDtos.ValidateCouponRequest;
import www.modules.promotions.service.PromotionService;
import www.security.CustomUserDetailsService.UserPrincipal;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionService promotionService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidationResult>> validate(
            @Valid @RequestBody ValidateCouponRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        String userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(
                promotionService.validate(request.getCode(), userId, request.getSubtotal())));
    }
}
