package www.modules.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.BadRequestException;
import www.exception.NotFoundException;
import www.modules.common.EcommerceEnums.ReservationStatus;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.inventory.dto.InventoryDtos;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.model.StockReservation;
import www.modules.inventory.repository.InventoryRepository;
import www.modules.inventory.repository.StockReservationRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private static final String DEFAULT_WAREHOUSE = "default";
    private static final int RESERVATION_MINUTES = 15;

    private final InventoryRepository inventoryRepository;
    private final StockReservationRepository reservationRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final MongoTemplate mongoTemplate;

    public Inventory ensureInventory(String variantId, int initialStock) {
        return inventoryRepository.findByVariantIdAndWarehouseId(variantId, DEFAULT_WAREHOUSE)
                .orElseGet(() -> inventoryRepository.save(Inventory.builder()
                        .variantId(variantId)
                        .warehouseId(DEFAULT_WAREHOUSE)
                        .onHand(initialStock)
                        .available(initialStock)
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    public Inventory getByVariant(String variantId) {
        return inventoryRepository.findByVariantIdAndWarehouseId(variantId, DEFAULT_WAREHOUSE)
                .orElseThrow(() -> new NotFoundException("Inventory not found for variant: " + variantId));
    }

    public List<Inventory> all() {
        return inventoryRepository.findAll();
    }

    public List<InventoryDtos.InventoryView> allViews() {
        return toViews(inventoryRepository.findAll());
    }

    public Page<InventoryDtos.InventoryView> allViews(String search, String stockFilter, Pageable pageable) {
        Query query = new Query();
        if (stockFilter != null && !stockFilter.isBlank() && !"ALL".equalsIgnoreCase(stockFilter)) {
            if ("LOW".equalsIgnoreCase(stockFilter)) {
                query.addCriteria(new Criteria().andOperator(
                        Criteria.where("available").gt(0),
                        Criteria.where("available").lte(5)));
            } else if ("OUT".equalsIgnoreCase(stockFilter)) {
                query.addCriteria(Criteria.where("available").lte(0));
            }
        }
        long total = mongoTemplate.count(query, Inventory.class);
        query.with(pageable);
        List<Inventory> pageItems = mongoTemplate.find(query, Inventory.class);
        List<InventoryDtos.InventoryView> views = toViews(pageItems).stream()
                .filter(view -> matchesInventorySearch(view, search))
                .toList();
        if (search != null && !search.isBlank()) {
            return new PageImpl<>(views, pageable, views.size());
        }
        return new PageImpl<>(views, pageable, total);
    }

    private boolean matchesInventorySearch(InventoryDtos.InventoryView view, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String keyword = search.trim().toLowerCase(Locale.ROOT);
        return contains(view.getProductName(), keyword)
                || contains(view.getSku(), keyword)
                || contains(view.getSize(), keyword)
                || contains(view.getColorName(), keyword)
                || contains(view.getVariantId(), keyword);
    }

    private boolean matchesStockFilter(InventoryDtos.InventoryView view, String stockFilter) {
        if (stockFilter == null || stockFilter.isBlank() || "ALL".equalsIgnoreCase(stockFilter)) {
            return true;
        }
        int available = view.getAvailable() != null ? view.getAvailable() : 0;
        if ("LOW".equalsIgnoreCase(stockFilter)) {
            return available > 0 && available <= 5;
        }
        if ("OUT".equalsIgnoreCase(stockFilter)) {
            return available <= 0;
        }
        return true;
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    public List<Inventory> lowStock(int threshold) {
        return inventoryRepository.findByAvailableLessThanEqual(threshold);
    }

    public List<InventoryDtos.InventoryView> lowStockViews(int threshold) {
        return toViews(inventoryRepository.findByAvailableLessThanEqual(threshold));
    }

    private List<InventoryDtos.InventoryView> toViews(List<Inventory> inventories) {
        List<String> variantIds = inventories.stream().map(Inventory::getVariantId).distinct().toList();
        Map<String, ProductVariant> variants = variantRepository.findAllById(variantIds).stream()
                .collect(Collectors.toMap(ProductVariant::getVariantId, Function.identity()));
        List<String> productIds = variants.values().stream()
                .map(ProductVariant::getProductId)
                .distinct()
                .toList();
        Map<String, Product> products = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getProductId, Function.identity()));

        return inventories.stream()
                .map(inventory -> {
                    ProductVariant variant = variants.get(inventory.getVariantId());
                    Product product = variant != null ? products.get(variant.getProductId()) : null;
                    return InventoryDtos.InventoryView.builder()
                            .inventoryId(inventory.getInventoryId())
                            .variantId(inventory.getVariantId())
                            .warehouseId(inventory.getWarehouseId())
                            .onHand(inventory.getOnHand())
                            .reserved(inventory.getReserved())
                            .sold(inventory.getSold())
                            .available(inventory.getAvailable())
                            .productId(variant != null ? variant.getProductId() : null)
                            .productName(product != null ? product.getName() : "Sản phẩm không xác định")
                            .sku(variant != null ? variant.getSku() : null)
                            .size(variant != null ? variant.getSize() : null)
                            .colorName(variant != null ? variant.getColorName() : null)
                            .build();
                })
                .toList();
    }

    public List<Inventory> importStock(List<InventoryDtos.ImportStockItem> items) {
        List<Inventory> updated = new ArrayList<>();
        for (InventoryDtos.ImportStockItem item : items) {
            updated.add(adjust(item.getVariantId(), item.getQuantity()));
        }
        return updated;
    }

    public Inventory adjust(String variantId, int quantityChange) {
        Inventory inventory = getByVariant(variantId);
        int onHand = inventory.getOnHand() + quantityChange;
        if (onHand < inventory.getReserved() + inventory.getSold()) {
            throw new BadRequestException("Stock adjustment would make available stock negative");
        }
        inventory.setOnHand(onHand);
        inventory.setAvailable(onHand - inventory.getReserved() - inventory.getSold());
        inventory.setUpdatedAt(LocalDateTime.now());
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public void restock(String variantId, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Restock quantity must be positive");
        }
        Inventory inventory = getByVariant(variantId);
        if (inventory.getSold() < quantity) {
            throw new BadRequestException("Cannot restock more than sold quantity");
        }
        inventory.setSold(inventory.getSold() - quantity);
        inventory.setOnHand(inventory.getOnHand() + quantity);
        inventory.setAvailable(inventory.getOnHand() - inventory.getReserved() - inventory.getSold());
        inventory.setUpdatedAt(LocalDateTime.now());
        inventoryRepository.save(inventory);
    }

    @Transactional
    public StockReservation reserve(String orderId, String variantId, int quantity) {
        Query query = new Query(Criteria.where("variant_id").is(variantId)
                .and("warehouse_id").is(DEFAULT_WAREHOUSE)
                .and("available").gte(quantity));
        Update update = new Update()
                .inc("reserved", quantity)
                .inc("available", -quantity)
                .set("updated_at", LocalDateTime.now());

        var result = mongoTemplate.updateFirst(query, update, Inventory.class);
        if (result.getModifiedCount() != 1) {
            throw new BadRequestException("Not enough stock for variant: " + variantId);
        }

        LocalDateTime now = LocalDateTime.now();
        return reservationRepository.save(StockReservation.builder()
                .orderId(orderId)
                .variantId(variantId)
                .quantity(quantity)
                .status(ReservationStatus.ACTIVE)
                .expiresAt(now.plusMinutes(RESERVATION_MINUTES))
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Transactional
    public void confirmOrderReservations(String orderId) {
        for (StockReservation reservation : reservationRepository.findByOrderId(orderId)) {
            if (reservation.getStatus() != ReservationStatus.ACTIVE) {
                continue;
            }
            Query query = new Query(Criteria.where("variant_id").is(reservation.getVariantId())
                    .and("warehouse_id").is(DEFAULT_WAREHOUSE)
                    .and("reserved").gte(reservation.getQuantity()));
            Update update = new Update()
                    .inc("reserved", -reservation.getQuantity())
                    .inc("sold", reservation.getQuantity())
                    .set("updated_at", LocalDateTime.now());
            mongoTemplate.updateFirst(query, update, Inventory.class);
            reservation.setStatus(ReservationStatus.CONFIRMED);
            reservation.setUpdatedAt(LocalDateTime.now());
            reservationRepository.save(reservation);
        }
    }

    @Transactional
    public void releaseOrderReservations(String orderId) {
        for (StockReservation reservation : reservationRepository.findByOrderId(orderId)) {
            release(reservation, ReservationStatus.RELEASED);
        }
    }

    @Transactional
    public int expireReservations() {
        int count = 0;
        for (StockReservation reservation : reservationRepository.findByStatusAndExpiresAtBefore(
                ReservationStatus.ACTIVE, LocalDateTime.now())) {
            release(reservation, ReservationStatus.EXPIRED);
            count++;
        }
        return count;
    }

    private void release(StockReservation reservation, ReservationStatus status) {
        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            return;
        }
        Query query = new Query(Criteria.where("variant_id").is(reservation.getVariantId())
                .and("warehouse_id").is(DEFAULT_WAREHOUSE)
                .and("reserved").gte(reservation.getQuantity()));
        Update update = new Update()
                .inc("reserved", -reservation.getQuantity())
                .inc("available", reservation.getQuantity())
                .set("updated_at", LocalDateTime.now());
        mongoTemplate.updateFirst(query, update, Inventory.class);
        reservation.setStatus(status);
        reservation.setUpdatedAt(LocalDateTime.now());
        reservationRepository.save(reservation);
    }
}
