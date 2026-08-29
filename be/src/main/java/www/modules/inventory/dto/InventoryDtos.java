package www.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

public final class InventoryDtos {
    private InventoryDtos() {}

    @Data
    public static class AdjustStockRequest {
        @NotNull
        private Integer quantityChange;
        private String reason;
    }

    @Data
    public static class ImportStockItem {
        @NotBlank
        private String variantId;
        @NotNull
        private Integer quantity;
    }

    @Data
    public static class ImportStockRequest {
        @NotNull
        private List<ImportStockItem> items = new ArrayList<>();
    }

    @Data
    @lombok.Builder
    public static class InventoryView {
        private String inventoryId;
        private String variantId;
        private String warehouseId;
        private Integer onHand;
        private Integer reserved;
        private Integer sold;
        private Integer available;
        private String productId;
        private String productName;
        private String sku;
        private String size;
        private String colorName;
    }
}
