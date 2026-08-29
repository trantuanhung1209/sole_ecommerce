package www.modules.promotions.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.NotFoundException;
import www.modules.promotions.dto.PromotionDtos.CouponValidationResult;
import www.modules.promotions.dto.PromotionDtos.UpsertCouponRequest;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.model.CouponUsage;
import www.modules.promotions.repository.CouponRepository;
import www.modules.promotions.repository.CouponUsageRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponValidator couponValidator;

    public CouponValidationResult validate(String code, String userId, double subtotal) {
        return couponValidator.validate(code, userId, subtotal);
    }

    public List<Coupon> listAll() {
        return couponRepository.findAll();
    }

    public Coupon create(UpsertCouponRequest request) {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.save(Coupon.builder()
                .code(request.getCode().trim().toUpperCase())
                .type(request.getType())
                .value(request.getValue())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : 0.0)
                .maxDiscount(request.getMaxDiscount())
                .usageLimit(request.getUsageLimit())
                .perUserLimit(request.getPerUserLimit() != null ? request.getPerUserLimit() : 1)
                .brandIds(request.getBrandIds())
                .categoryIds(request.getCategoryIds())
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .active(request.getActive() == null || request.getActive())
                .usedCount(0)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    public Coupon update(String couponId, UpsertCouponRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new NotFoundException("Coupon not found"));
        coupon.setCode(request.getCode().trim().toUpperCase());
        coupon.setType(request.getType());
        coupon.setValue(request.getValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setMaxDiscount(request.getMaxDiscount());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setPerUserLimit(request.getPerUserLimit());
        coupon.setBrandIds(request.getBrandIds());
        coupon.setCategoryIds(request.getCategoryIds());
        coupon.setStartsAt(request.getStartsAt());
        coupon.setEndsAt(request.getEndsAt());
        if (request.getActive() != null) {
            coupon.setActive(request.getActive());
        }
        coupon.setUpdatedAt(LocalDateTime.now());
        return couponRepository.save(coupon);
    }

    @Transactional
    public void recordUsage(Coupon coupon, String userId, String orderId, double discountApplied) {
        coupon.setUsedCount((coupon.getUsedCount() != null ? coupon.getUsedCount() : 0) + 1);
        coupon.setUpdatedAt(LocalDateTime.now());
        couponRepository.save(coupon);
        couponUsageRepository.save(CouponUsage.builder()
                .usageId(UUID.randomUUID().toString())
                .couponId(coupon.getCouponId())
                .code(coupon.getCode())
                .userId(userId)
                .orderId(orderId)
                .discountApplied(discountApplied)
                .usedAt(LocalDateTime.now())
                .build());
    }
}
