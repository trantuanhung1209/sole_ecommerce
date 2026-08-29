package www.modules.payments.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.payments.dto.PaymentDtos.PaymentCallbackRequest;
import www.modules.payments.model.EcommercePayment;
import www.modules.payments.service.EcommercePaymentService;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class EcommercePaymentController {
    private final EcommercePaymentService paymentService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<EcommercePayment>> byOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.byOrder(orderId)));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<EcommercePayment>> byId(@PathVariable String paymentId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.get(paymentId)));
    }

    @PostMapping("/sepay/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> payload) {
        String invoice = (String) payload.getOrDefault("orderInvoiceNumber", payload.get("order_invoice_number"));
        String status = (String) payload.getOrDefault("status", payload.getOrDefault("transaction_status", "FAILED"));
        String txId = (String) payload.getOrDefault("transactionId", payload.get("transaction_id"));
        boolean ok = paymentService.handleCallback(invoice, status, txId, payload);
        return ok ? ResponseEntity.ok("Success") : ResponseEntity.badRequest().body("Failed");
    }

    @GetMapping("/sepay/callback")
    public ResponseEntity<String> callbackGet(
            @RequestParam String orderInvoiceNumber,
            @RequestParam String status,
            @RequestParam String transactionId) {
        boolean ok = paymentService.handleCallback(orderInvoiceNumber, status, transactionId, Map.of(
                "orderInvoiceNumber", orderInvoiceNumber,
                "status", status,
                "transactionId", transactionId
        ));
        return ok ? ResponseEntity.ok("Success") : ResponseEntity.badRequest().body("Failed");
    }

    @PostMapping("/callback")
    public ResponseEntity<ApiResponse<Boolean>> genericCallback(@RequestBody PaymentCallbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.handleCallback(
                request.getOrderInvoiceNumber(), request.getStatus(), request.getTransactionId(), request.getPayload())));
    }

    @PostMapping("/reconcile")
    public ResponseEntity<ApiResponse<Integer>> reconcile() {
        return ResponseEntity.ok(ApiResponse.success("Expired payments reconciled", paymentService.expirePendingPayments()));
    }
}
