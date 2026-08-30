package www.modules.returns.service;

import org.junit.jupiter.api.Test;
import www.modules.common.EcommerceEnums.ReturnItemCondition;

import static org.junit.jupiter.api.Assertions.*;

class ReturnRefundPolicyTest {

    @Test
    void computeMaxRefundAmount_goodIsFullLineTotal() {
        assertEquals(500_000, ReturnRefundPolicy.computeMaxRefundAmount(500_000, ReturnItemCondition.GOOD));
    }

    @Test
    void computeMaxRefundAmount_damagedIsHalf() {
        assertEquals(250_000, ReturnRefundPolicy.computeMaxRefundAmount(500_000, ReturnItemCondition.DAMAGED));
    }

    @Test
    void computeMaxRefundAmount_incompleteIsThirtyPercent() {
        assertEquals(150_000, ReturnRefundPolicy.computeMaxRefundAmount(500_000, ReturnItemCondition.INCOMPLETE));
    }

    @Test
    void shouldRestock_onlyGood() {
        assertTrue(ReturnRefundPolicy.shouldRestock(ReturnItemCondition.GOOD));
        assertFalse(ReturnRefundPolicy.shouldRestock(ReturnItemCondition.DAMAGED));
        assertFalse(ReturnRefundPolicy.shouldRestock(ReturnItemCondition.INCOMPLETE));
    }
}
