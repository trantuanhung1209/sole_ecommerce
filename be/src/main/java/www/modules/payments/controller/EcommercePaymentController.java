package www.modules.payments.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.payments.dto.PaymentDtos.PaymentCallbackRequest;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.payments.service.SePayIpnVerifier;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class EcommercePaymentController {
    private final EcommercePaymentService paymentService;
    private final SePayIpnVerifier sePayIpnVerifier;
    private final ObjectMapper objectMapper;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<EcommercePayment>> byOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.byOrder(orderId)));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<EcommercePayment>> byId(@PathVariable String paymentId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.get(paymentId)));
    }

    @PostMapping("/sepay/callback")
    public ResponseEntity<String> callback(HttpServletRequest request, @RequestBody String rawBody) {
        sePayIpnVerifier.verify(request, rawBody);
        Map<String, Object> payload = parsePayload(rawBody);
        String invoice = stringVal(payload, "orderInvoiceNumber", "order_invoice_number");
        String status = stringVal(payload, "status", "transaction_status");
        if (status == null) {
            status = "FAILED";
        }
        String txId = stringVal(payload, "transactionId", "transaction_id");
        String signature = request.getHeader("X-SePay-Signature");
        if (signature == null) {
            signature = stringVal(payload, "signature");
        }
        boolean ok = paymentService.handleCallback(invoice, status, txId, payload, signature);
        return ok ? ResponseEntity.ok("Success") : ResponseEntity.badRequest().body("Failed");
    }

    /** Browser redirect only — must not mutate payment state (IPN POST is authoritative). */
    @GetMapping("/sepay/callback")
    public ResponseEntity<String> callbackGet(
            @RequestParam(required = false) String orderInvoiceNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String transactionId) {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/callback")
    public ResponseEntity<ApiResponse<Boolean>> genericCallback(@RequestBody PaymentCallbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.handleCallback(
                request.getOrderInvoiceNumber(),
                request.getStatus(),
                request.getTransactionId(),
                request.getPayload(),
                null)));
    }

    @PostMapping("/reconcile")
    public ResponseEntity<ApiResponse<Integer>> reconcile() {
        return ResponseEntity.ok(ApiResponse.success("Expired payments reconciled", paymentService.expirePendingPayments()));
    }

    private Map<String, Object> parsePayload(String rawBody) {
        try {
            return objectMapper.readValue(rawBody, new TypeReference<>() {});
        } catch (Exception e) {
            throw new www.exception.BadRequestException("Invalid callback payload");
        }
    }

    private String stringVal(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object val = payload.get(key);
            if (val != null) {
                return String.valueOf(val);
            }
        }
        return null;
    }
}
