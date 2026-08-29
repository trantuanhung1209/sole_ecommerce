package www.modules.inventory.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.inventory.model.Inventory;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends MongoRepository<Inventory, String> {
    Optional<Inventory> findByVariantIdAndWarehouseId(String variantId, String warehouseId);

    List<Inventory> findByAvailableLessThanEqual(int threshold);

    long countByAvailableLessThanEqual(int threshold);
}
