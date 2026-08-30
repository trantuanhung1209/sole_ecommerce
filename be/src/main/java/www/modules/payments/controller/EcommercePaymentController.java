package www.modules.payments.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.exception.ForbiddenException;
import www.model.dto.response.ApiResponse;
import www.modules.orders.service.OrderService;
import www.modules.payments.dto.PaymentDtos.PaymentCallbackRequest;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.service.EcommercePaymentService;
import www.modules.payments.service.SePayIpnParser;
import www.modules.payments.service.SePayIpnVerifier;
import www.security.CustomUserDetailsService.UserPrincipal;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class EcommercePaymentController {
    private final EcommercePaymentService paymentService;
    private final OrderService orderService;
    private final SePayIpnVerifier sePayIpnVerifier;
    private final SePayIpnParser sePayIpnParser;
    private final ObjectMapper objectMapper;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<EcommercePayment>> byOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        orderService.getOwned(orderId, userId(authentication));
        return ResponseEntity.ok(ApiResponse.success(paymentService.byOrder(orderId)));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<EcommercePayment>> byId(
            @PathVariable String paymentId,
            Authentication authentication) {
        EcommercePayment payment = paymentService.get(paymentId);
        orderService.getOwned(payment.getOrderId(), userId(authentication));
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @PostMapping("/sepay/callback")
    public ResponseEntity<Map<String, Boolean>> callback(HttpServletRequest request, @RequestBody String rawBody) {
        sePayIpnVerifier.verify(request, rawBody);
        Map<String, Object> payload = parsePayload(rawBody);
        SePayIpnParser.ParsedIpn ipn = sePayIpnParser.parse(payload);
        if (ipn.orderInvoiceNumber() == null || ipn.transactionId() == null) {
            throw new www.exception.BadRequestException("Missing invoice or transaction ID in SePay IPN");
        }
        String signature = request.getHeader("X-SePay-Signature");
        if (signature == null) {
            signature = stringVal(payload, "signature");
        }
        boolean ok = paymentService.handleCallback(
                ipn.orderInvoiceNumber(),
                ipn.status() != null ? ipn.status() : "FAILED",
                ipn.transactionId(),
                ipn.rawPayload(),
                signature);
        return ok
                ? ResponseEntity.ok(Map.of("success", true))
                : ResponseEntity.badRequest().body(Map.of("success", false));
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
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> genericCallback(@RequestBody PaymentCallbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.handleCallback(
                request.getOrderInvoiceNumber(),
                request.getStatus(),
                request.getTransactionId(),
                request.getPayload(),
                null)));
    }

    @PostMapping("/reconcile")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> reconcile() {
        return ResponseEntity.ok(ApiResponse.success("Expired payments reconciled", paymentService.expirePendingPayments()));
    }

    private String userId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ForbiddenException("Authentication required");
        }
        return principal.getId();
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
