package www.modules.checkout.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.checkout.dto.CheckoutDtos.CheckoutPreview;
import www.modules.checkout.dto.CheckoutDtos.CheckoutRequest;
import www.modules.checkout.service.CheckoutService;
import www.modules.payments.dto.PaymentDtos.PaymentCheckoutResponse;
import www.security.CustomUserDetailsService.UserPrincipal;

@RestController
@RequestMapping("/checkout")
@RequiredArgsConstructor
public class CheckoutController {
    private final CheckoutService checkoutService;

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<CheckoutPreview>> preview(
            Authentication authentication,
            @RequestParam(required = false) String couponCode) {
        return ResponseEntity.ok(ApiResponse.success(checkoutService.preview(
                ((UserPrincipal) authentication.getPrincipal()).getId(), couponCode)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentCheckoutResponse>> checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Checkout created",
                checkoutService.checkout(((UserPrincipal) authentication.getPrincipal()).getId(), request)));
    }
}
