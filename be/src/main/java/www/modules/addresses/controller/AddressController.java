package www.modules.addresses.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.addresses.dto.AddressDtos.AddressRequest;
import www.modules.addresses.model.Address;
import www.modules.addresses.service.AddressService;
import www.security.CustomUserDetailsService.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Address>>> list(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(addressService.list(userId(authentication))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Address>> create(
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Address created",
                addressService.create(userId(authentication), request)));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Address>> update(
            @PathVariable String addressId,
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Address updated",
                addressService.update(userId(authentication), addressId, request)));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String addressId,
            Authentication authentication) {
        addressService.delete(userId(authentication), addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }

    @PostMapping("/{addressId}/default")
    public ResponseEntity<ApiResponse<Address>> setDefault(
            @PathVariable String addressId,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Default address updated",
                addressService.setDefault(userId(authentication), addressId)));
    }

    private String userId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getId();
    }
}
