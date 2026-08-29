package www.modules.promotions;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.promotions.model.Coupon;
import www.modules.promotions.model.CouponUsage;
import www.modules.promotions.repository.CouponRepository;
import www.modules.promotions.repository.CouponUsageRepository;
import www.modules.promotions.service.CouponValidator;
import www.modules.promotions.service.PromotionService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {

    @Mock private CouponRepository couponRepository;
    @Mock private CouponUsageRepository couponUsageRepository;
    @Mock private CouponValidator couponValidator;

    @InjectMocks
    private PromotionService promotionService;

    @Test
    void recordUsage_incrementsCountAndPersistsUsage() {
        Coupon coupon = Coupon.builder()
                .couponId("c1")
                .code("SOLE10")
                .usedCount(2)
                .build();
        when(couponRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(couponUsageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        promotionService.recordUsage(coupon, "u1", "o1", 50_000);

        assertEquals(3, coupon.getUsedCount());
        ArgumentCaptor<CouponUsage> usageCaptor = ArgumentCaptor.forClass(CouponUsage.class);
        verify(couponUsageRepository).save(usageCaptor.capture());
        assertEquals("u1", usageCaptor.getValue().getUserId());
        assertEquals("o1", usageCaptor.getValue().getOrderId());
        assertEquals(50_000, usageCaptor.getValue().getDiscountApplied());
    }
}
