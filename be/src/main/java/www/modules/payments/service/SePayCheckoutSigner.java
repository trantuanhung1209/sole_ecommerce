package www.modules.payments.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import www.config.SePayProperties;
import www.exception.BadRequestException;
import www.modules.payments.model.EcommercePayment;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SePayCheckoutSigner {
    private static final List<String> SIGNED_FIELDS = List.of(
            "order_amount",
            "merchant",
            "currency",
            "operation",
            "order_description",
            "order_invoice_number",
            "customer_id",
            "payment_method",
            "success_url",
            "error_url",
            "cancel_url"
    );

    private final SePayProperties sepayProperties;

    public Map<String, String> buildSignedFormData(EcommercePayment payment) {
        String merchantId = sepayProperties.getMerchantId();
        String secretKey = sepayProperties.getSecretKey();
        if (merchantId == null || merchantId.isBlank()) {
            throw new BadRequestException("SEPAY_MERCHANT_ID chưa được cấu hình");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new BadRequestException("SEPAY_SECRET_KEY chưa được cấu hình");
        }

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("order_amount", String.valueOf(payment.getAmount().intValue()));
        fields.put("merchant", merchantId);
        fields.put("currency", payment.getCurrency());
        fields.put("operation", "PURCHASE");
        fields.put("order_description", "Thanh toán đơn hàng " + payment.getOrderCode());
        fields.put("order_invoice_number", payment.getOrderInvoiceNumber());
        fields.put("success_url", payment.getSuccessUrl());
        fields.put("error_url", payment.getErrorUrl());
        fields.put("cancel_url", payment.getCancelUrl());
        fields.put("signature", sign(fields, secretKey));
        return fields;
    }

    public String sign(Map<String, String> fields, String secretKey) {
        String signedString = buildSignedString(fields);
        return base64HmacSha256(secretKey, signedString);
    }

    private String buildSignedString(Map<String, String> fields) {
        StringBuilder sb = new StringBuilder();
        for (String field : SIGNED_FIELDS) {
            String value = fields.get(field);
            if (value == null || value.isBlank()) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append(',');
            }
            sb.append(field).append('=').append(value);
        }
        return sb.toString();
    }

    private String base64HmacSha256(String secretKey, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new BadRequestException("Không thể tạo chữ ký SePay");
        }
    }
}
