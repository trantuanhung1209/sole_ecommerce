package www.modules.inventory.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "inventory")
@CompoundIndex(name = "variant_warehouse_unique", def = "{ 'variant_id': 1, 'warehouse_id': 1 }", unique = true)
public class Inventory {
    @Id
    private String inventoryId;
    @Field("variant_id")
    private String variantId;
    @Field("warehouse_id")
    @Builder.Default
    private String warehouseId = "default";
    @Builder.Default
    private Integer onHand = 0;
    @Builder.Default
    private Integer reserved = 0;
    @Builder.Default
    private Integer sold = 0;
    @Builder.Default
    private Integer available = 0;
    @Version
    private Long version;
    @Field("updated_at")
    private LocalDateTime updatedAt;
}
