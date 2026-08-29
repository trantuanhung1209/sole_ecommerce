package www.modules.checkout.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ShippingFeeCalculator {

    @Value("${shipping.flat-fee:30000}")
    private double flatFee;

    @Value("${shipping.free-threshold:2000000}")
    private double freeThreshold;

    public double calculate(double subtotal) {
        if (subtotal <= 0) {
            return 0;
        }
        if (subtotal >= freeThreshold) {
            return 0;
        }
        return flatFee;
    }
}
