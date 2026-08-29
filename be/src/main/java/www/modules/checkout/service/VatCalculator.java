package www.modules.checkout.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VatCalculator {

    @Value("${vat.rate:0}")
    private double vatRate;

    public double calculateTaxableAmount(double subtotal, double discountTotal) {
        return Math.max(0, subtotal - discountTotal);
    }

    public double calculateTax(double subtotal, double discountTotal) {
        if (vatRate <= 0) {
            return 0;
        }
        return calculateTaxableAmount(subtotal, discountTotal) * vatRate;
    }
}
