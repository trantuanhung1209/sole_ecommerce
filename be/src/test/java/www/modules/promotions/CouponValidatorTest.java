package www.modules.promotions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.exception.BadRequestException;
import www.modules.promotions.PromotionEnums.CouponType;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.repository.CouponRepository;
import www.modules.promotions.repository.CouponUsageRepository;
import www.modules.promotions.service.CouponValidator;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponValidatorTest {

    @Mock
    private CouponRepository couponRepository;
    @Mock
    private CouponUsageRepository couponUsageRepository;

    @InjectMocks
    private CouponValidator couponValidator;

    private Coupon activePercentCoupon;

    @BeforeEach
    void setUp() {
        activePercentCoupon = Coupon.builder()
                .couponId("c1")
                .code("SOLE10")
                .type(CouponType.PERCENTAGE)
                .value(10.0)
                .minOrderAmount(100_000.0)
                .maxDiscount(50_000.0)
                .usageLimit(100)
                .usedCount(0)
                .perUserLimit(1)
                .active(true)
                .startsAt(LocalDateTime.now().minusDays(1))
                .endsAt(LocalDateTime.now().plusDays(7))
                .build();
    }

    @Test
    void validate_blankCode_invalid() {
        var result = couponValidator.validate("  ", "u1", 500_000);
        assertFalse(result.isValid());
        assertEquals("Mã giảm giá không hợp lệ", result.getMessage());
    }

    @Test
    void validate_unknownCode_invalid() {
        when(couponRepository.findByCodeIgnoreCase("MISSING")).thenReturn(Optional.empty());
        var result = couponValidator.validate("MISSING", "u1", 500_000);
        assertFalse(result.isValid());
    }

    @Test
    void validate_inactiveCoupon_invalid() {
        activePercentCoupon.setActive(false);
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        var result = couponValidator.validate("SOLE10", "u1", 500_000);
        assertFalse(result.isValid());
    }

    @Test
    void validate_notYetStarted_invalid() {
        activePercentCoupon.setStartsAt(LocalDateTime.now().plusDays(1));
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        var result = couponValidator.validate("SOLE10", "u1", 500_000);
        assertEquals("Mã giảm giá chưa có hiệu lực", result.getMessage());
    }

    @Test
    void validate_expired_invalid() {
        activePercentCoupon.setEndsAt(LocalDateTime.now().minusHours(1));
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        var result = couponValidator.validate("SOLE10", "u1", 500_000);
        assertEquals("Mã giảm giá đã hết hạn", result.getMessage());
    }

    @Test
    void validate_belowMinOrder_invalid() {
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        var result = couponValidator.validate("SOLE10", "u1", 50_000);
        assertEquals("Đơn hàng chưa đạt giá trị tối thiểu", result.getMessage());
    }

    @Test
    void validate_usageLimitReached_invalid() {
        activePercentCoupon.setUsageLimit(5);
        activePercentCoupon.setUsedCount(5);
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        var result = couponValidator.validate("SOLE10", "u1", 500_000);
        assertEquals("Mã giảm giá đã hết lượt sử dụng", result.getMessage());
    }

    @Test
    void validate_perUserLimitReached_invalid() {
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        when(couponUsageRepository.countByCouponIdAndUserId("c1", "u1")).thenReturn(1L);
        var result = couponValidator.validate("SOLE10", "u1", 500_000);
        assertEquals("Bạn đã dùng hết lượt cho mã này", result.getMessage());
    }

    @Test
    void validate_percentage_appliesMaxDiscount() {
        when(couponRepository.findByCodeIgnoreCase("SOLE10")).thenReturn(Optional.of(activePercentCoupon));
        var result = couponValidator.validate("SOLE10", "u1", 1_000_000);
        assertTrue(result.isValid());
        assertEquals(50_000, result.getDiscountAmount());
    }

    @Test
    void validate_fixedAmount_cappedBySubtotal() {
        Coupon fixed = Coupon.builder()
                .code("FIXED")
                .type(CouponType.FIXED_AMOUNT)
                .value(200_000.0)
                .active(true)
                .build();
        when(couponRepository.findByCodeIgnoreCase("FIXED")).thenReturn(Optional.of(fixed));
        var result = couponValidator.validate("FIXED", "u1", 150_000);
        assertTrue(result.isValid());
        assertEquals(150_000, result.getDiscountAmount());
    }

    @Test
    void validate_freeShipping_zeroDiscountFlag() {
        Coupon freeShip = Coupon.builder()
                .code("FREESHIP")
                .type(CouponType.FREE_SHIPPING)
                .value(0.0)
                .active(true)
                .build();
        when(couponRepository.findByCodeIgnoreCase("FREESHIP")).thenReturn(Optional.of(freeShip));
        var result = couponValidator.validate("FREESHIP", "u1", 500_000);
        assertTrue(result.isValid());
        assertTrue(result.isFreeShipping());
        assertEquals(0, result.getDiscountAmount());
    }

    @Test
    void requireValid_throwsWhenInvalid() {
        when(couponRepository.findByCodeIgnoreCase("BAD")).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> couponValidator.requireValid("BAD", "u1", 100_000));
    }

    @Test
    void computeDiscount_neverNegative() {
        Coupon fixed = Coupon.builder().type(CouponType.FIXED_AMOUNT).value(-10.0).build();
        assertEquals(0, couponValidator.computeDiscount(fixed, 100_000));
    }
}
