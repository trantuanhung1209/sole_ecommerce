package www.modules.payments;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import www.config.SePayProperties;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.service.SePayCheckoutSigner;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SePayCheckoutSignerTest {

    private SePayCheckoutSigner signer;

    @BeforeEach
    void setUp() {
        SePayProperties properties = new SePayProperties();
        properties.setMerchantId("MERCHANT_123");
        properties.setSecretKey("test-secret-key");
        signer = new SePayCheckoutSigner(properties);
    }

    @Test
    void sign_usesSePayFieldOrderAndBase64Hmac() {
        Map<String, String> fields = Map.of(
                "order_amount", "100000",
                "merchant", "MERCHANT_123",
                "currency", "VND",
                "operation", "PURCHASE",
                "order_description", "Payment for order #12345",
                "order_invoice_number", "INV_20231201_001",
                "success_url", "https://yoursite.com/payment/success",
                "error_url", "https://yoursite.com/payment/error",
                "cancel_url", "https://yoursite.com/payment/cancel"
        );

        String signature = signer.sign(fields, "test-secret-key");

        assertNotNull(signature);
        assertFalse(signature.isBlank());
        assertEquals(signature, signer.sign(fields, "test-secret-key"));
        assertNotEquals(signature, signer.sign(fields, "other-secret"));
    }

    @Test
    void buildSignedFormData_includesSignatureLast() {
        EcommercePayment payment = EcommercePayment.builder()
                .orderCode("ORD-001")
                .orderInvoiceNumber("INV-001")
                .amount(250000.0)
                .currency("VND")
                .successUrl("http://localhost:3000/payment/success")
                .errorUrl("http://localhost:3000/payment/error")
                .cancelUrl("http://localhost:3000/payment/cancel")
                .build();

        Map<String, String> formData = signer.buildSignedFormData(payment);

        assertEquals("250000", formData.get("order_amount"));
        assertEquals("MERCHANT_123", formData.get("merchant"));
        assertNotNull(formData.get("signature"));
        assertFalse(formData.get("signature").isBlank());
    }
}
