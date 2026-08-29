package www.modules.inventory.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.common.PageResponse;
import www.model.dto.response.ApiResponse;
import www.util.PageUtils;
import www.modules.inventory.dto.InventoryDtos.AdjustStockRequest;
import www.modules.inventory.dto.InventoryDtos.ImportStockRequest;
import www.modules.inventory.dto.InventoryDtos.InventoryView;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.service.InventoryService;

import java.util.List;

@RestController
@RequestMapping("/admin/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InventoryView>>> all(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String stockFilter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                PageUtils.toPageResponse(inventoryService.allViews(search, stockFilter, Pageable.ofSize(size).withPage(page)))));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<InventoryView>>> lowStock(
            @RequestParam(defaultValue = "5") int threshold) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.lowStockViews(threshold)));
    }

    @GetMapping("/{variantId}")
    public ResponseEntity<ApiResponse<Inventory>> byVariant(@PathVariable String variantId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getByVariant(variantId)));
    }

    @PutMapping("/{variantId}/adjust")
    @PreAuthorize("@perm.has(authentication, 'INVENTORY_UPDATE')")
    public ResponseEntity<ApiResponse<Inventory>> adjust(
            @PathVariable String variantId,
            @Valid @RequestBody AdjustStockRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Inventory adjusted",
                inventoryService.adjust(variantId, request.getQuantityChange())));
    }

    @PostMapping("/import")
    @PreAuthorize("@perm.has(authentication, 'INVENTORY_UPDATE')")
    public ResponseEntity<ApiResponse<List<Inventory>>> importStock(
            @Valid @RequestBody ImportStockRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Inventory imported",
                inventoryService.importStock(request.getItems())));
    }
}
