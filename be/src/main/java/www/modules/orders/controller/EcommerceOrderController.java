package www.modules.orders.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.common.PageResponse;
import www.model.dto.response.ApiResponse;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.orders.model.Order;
import www.modules.orders.service.OrderService;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.util.PageUtils;

@RestController
@RequiredArgsConstructor
public class EcommerceOrderController {
    private final OrderService orderService;

    @GetMapping("/orders/my-orders")
    public ResponseEntity<ApiResponse<PageResponse<Order>>> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        var result = orderService.mine(userId(authentication),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(result)));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<Order>> get(@PathVariable String orderId, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOwned(orderId, userId(authentication))));
    }

    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<ApiResponse<Order>> cancel(
            @PathVariable String orderId,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        orderService.getOwned(orderId, userId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", orderService.cancel(orderId, reason)));
    }

    @GetMapping("/admin/orders")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<Order>>> adminOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(
                orderService.adminList(status, search, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))))));
    }

    @GetMapping("/admin/orders/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Order>> adminGet(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.get(orderId)));
    }

    @PutMapping("/admin/orders/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Order>> updateStatus(
            @PathVariable String orderId,
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderService.updateStatus(orderId, status)));
    }

    @PostMapping("/admin/orders/{orderId}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Order>> confirm(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.updateStatus(orderId, OrderStatus.CONFIRMED)));
    }

    @PostMapping("/admin/orders/{orderId}/ship")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Order>> ship(
            @PathVariable String orderId,
            @RequestParam(required = false) String trackingCode) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updateStatus(orderId, OrderStatus.SHIPPED, trackingCode)));
    }

    @PostMapping("/admin/orders/{orderId}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Order>> deliver(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.updateStatus(orderId, OrderStatus.DELIVERED)));
    }

    @PostMapping("/admin/orders/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Order>> adminCancel(
            @PathVariable String orderId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", orderService.cancel(orderId, reason)));
    }

    private String userId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getId();
    }
}
