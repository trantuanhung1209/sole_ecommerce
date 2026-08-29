package www.modules.checkout;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import www.modules.checkout.service.ShippingFeeCalculator;
import www.modules.checkout.service.VatCalculator;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CheckoutCalculatorTest {

    private ShippingFeeCalculator shippingFeeCalculator;
    private VatCalculator vatCalculator;

    @BeforeEach
    void setUp() {
        shippingFeeCalculator = new ShippingFeeCalculator();
        ReflectionTestUtils.setField(shippingFeeCalculator, "flatFee", 30_000.0);
        ReflectionTestUtils.setField(shippingFeeCalculator, "freeThreshold", 2_000_000.0);

        vatCalculator = new VatCalculator();
        ReflectionTestUtils.setField(vatCalculator, "vatRate", 0.08);
    }

    @Test
    void shipping_zeroSubtotal() {
        assertEquals(0, shippingFeeCalculator.calculate(0));
        assertEquals(0, shippingFeeCalculator.calculate(-100));
    }

    @Test
    void shipping_belowThreshold_chargesFlatFee() {
        assertEquals(30_000, shippingFeeCalculator.calculate(1_999_999));
    }

    @Test
    void shipping_atThreshold_free() {
        assertEquals(0, shippingFeeCalculator.calculate(2_000_000));
    }

    @Test
    void vat_disabledWhenRateZero() {
        ReflectionTestUtils.setField(vatCalculator, "vatRate", 0.0);
        assertEquals(0, vatCalculator.calculateTax(1_000_000, 0));
    }

    @Test
    void vat_appliedAfterDiscount() {
        assertEquals(72_000, vatCalculator.calculateTax(1_000_000, 100_000));
    }

    @Test
    void vat_taxableAmountNeverNegative() {
        assertEquals(0, vatCalculator.calculateTaxableAmount(100_000, 200_000));
    }
}
