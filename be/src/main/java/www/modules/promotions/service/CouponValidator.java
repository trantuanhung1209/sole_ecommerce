package www.modules.promotions.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import www.exception.BadRequestException;
import www.modules.promotions.PromotionEnums.CouponType;
import www.modules.promotions.dto.PromotionDtos.CouponValidationResult;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.repository.CouponRepository;
import www.modules.promotions.repository.CouponUsageRepository;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class CouponValidator {
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    public CouponValidationResult validate(String code, String userId, double subtotal) {
        CouponValidationResult result = new CouponValidationResult();
        result.setValid(false);
        if (code == null || code.isBlank()) {
            result.setMessage("Mã giảm giá không hợp lệ");
            return result;
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElse(null);
        if (coupon == null || !Boolean.TRUE.equals(coupon.getActive())) {
            result.setMessage("Mã giảm giá không tồn tại hoặc đã tắt");
            return result;
        }
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            result.setMessage("Mã giảm giá chưa có hiệu lực");
            return result;
        }
        if (coupon.getEndsAt() != null && now.isAfter(coupon.getEndsAt())) {
            result.setMessage("Mã giảm giá đã hết hạn");
            return result;
        }
        if (coupon.getMinOrderAmount() != null && subtotal < coupon.getMinOrderAmount()) {
            result.setMessage("Đơn hàng chưa đạt giá trị tối thiểu");
            return result;
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            result.setMessage("Mã giảm giá đã hết lượt sử dụng");
            return result;
        }
        if (userId != null && coupon.getPerUserLimit() != null) {
            long userUses = couponUsageRepository.countByCouponIdAndUserId(coupon.getCouponId(), userId);
            if (userUses >= coupon.getPerUserLimit()) {
                result.setMessage("Bạn đã dùng hết lượt cho mã này");
                return result;
            }
        }

        double discount = computeDiscount(coupon, subtotal);
        result.setValid(true);
        result.setCode(coupon.getCode());
        result.setType(coupon.getType());
        result.setDiscountAmount(discount);
        result.setFreeShipping(coupon.getType() == CouponType.FREE_SHIPPING);
        result.setMessage("Áp dụng thành công");
        return result;
    }

    public Coupon requireValid(String code, String userId, double subtotal) {
        CouponValidationResult validation = validate(code, userId, subtotal);
        if (!validation.isValid()) {
            throw new BadRequestException(validation.getMessage());
        }
        return couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BadRequestException("Coupon not found"));
    }

    public double computeDiscount(Coupon coupon, double subtotal) {
        if (coupon.getType() == CouponType.FREE_SHIPPING) {
            return 0;
        }
        double discount = 0;
        if (coupon.getType() == CouponType.PERCENTAGE) {
            discount = subtotal * (coupon.getValue() / 100.0);
        } else if (coupon.getType() == CouponType.FIXED_AMOUNT) {
            discount = coupon.getValue();
        }
        if (coupon.getMaxDiscount() != null) {
            discount = Math.min(discount, coupon.getMaxDiscount());
        }
        return Math.min(Math.max(discount, 0), subtotal);
    }
}
