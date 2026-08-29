package www.modules.returns.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import www.model.dto.common.PageResponse;
import www.model.dto.response.ApiResponse;
import www.modules.common.EcommerceEnums.ReturnStatus;
import www.modules.returns.dto.ReturnDtos.*;
import www.modules.returns.model.ReturnRequest;
import www.modules.returns.service.ReturnService;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.util.PageUtils;

@RestController
@RequiredArgsConstructor
public class ReturnController {
    private final ReturnService returnService;

    @GetMapping("/returns")
    public ResponseEntity<ApiResponse<PageResponse<ReturnRequest>>> mine(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(
                returnService.mine(user.getId(), pageable(page, size)))));
    }

    @GetMapping("/returns/my-returns")
    public ResponseEntity<ApiResponse<PageResponse<ReturnRequest>>> myReturns(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return mine(user, page, size);
    }

    @GetMapping("/returns/{returnId}")
    public ResponseEntity<ApiResponse<ReturnRequest>> get(
            @PathVariable String returnId,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(returnService.getOwned(returnId, user.getId())));
    }

    @PostMapping("/returns")
    public ResponseEntity<ApiResponse<ReturnRequest>> create(
            @Valid @RequestBody CreateReturnRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success("Return request created", returnService.create(user.getId(), request)));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @GetMapping("/admin/returns")
    public ResponseEntity<ApiResponse<PageResponse<ReturnRequest>>> adminList(
            @RequestParam(required = false) ReturnStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(
                returnService.adminList(status, pageable(page, size)))));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @GetMapping("/admin/returns/{returnId}")
    public ResponseEntity<ApiResponse<ReturnRequest>> adminGet(@PathVariable String returnId) {
        return ResponseEntity.ok(ApiResponse.success(returnService.get(returnId)));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @PutMapping("/admin/returns/{returnId}/status")
    public ResponseEntity<ApiResponse<ReturnRequest>> updateStatus(
            @PathVariable String returnId,
            @Valid @RequestBody UpdateReturnStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(returnService.updateStatus(returnId, request)));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @PostMapping("/admin/returns/{returnId}/staff-confirm")
    public ResponseEntity<ApiResponse<ReturnRequest>> staffConfirm(
            @PathVariable String returnId,
            @RequestBody(required = false) UpdateReturnStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(returnService.staffConfirm(returnId, request)));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @PostMapping("/admin/returns/{returnId}/reject")
    public ResponseEntity<ApiResponse<ReturnRequest>> reject(
            @PathVariable String returnId,
            @RequestBody(required = false) UpdateReturnStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(returnService.reject(returnId, request)));
    }

    @PreAuthorize("hasAnyRole('SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @PostMapping("/admin/returns/{returnId}/approve")
    public ResponseEntity<ApiResponse<ReturnRequest>> approve(
            @PathVariable String returnId,
            @RequestBody(required = false) UpdateReturnStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(returnService.approve(returnId, request)));
    }

    @PreAuthorize("hasAnyRole('STAFF','SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @PostMapping("/admin/returns/{returnId}/mark-received")
    public ResponseEntity<ApiResponse<ReturnRequest>> markReceived(
            @PathVariable String returnId,
            @RequestBody(required = false) UpdateReturnStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(returnService.markReceived(returnId, request)));
    }

    @PreAuthorize("hasAnyRole('SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
    @PostMapping("/admin/returns/{returnId}/refund")
    public ResponseEntity<ApiResponse<ReturnRequest>> refund(
            @PathVariable String returnId,
            @RequestBody(required = false) UpdateReturnStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(returnService.refund(returnId, request)));
    }

    private static PageRequest pageable(int page, int size) {
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
