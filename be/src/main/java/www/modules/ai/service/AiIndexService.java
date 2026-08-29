package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import www.modules.ai.model.AiEmbedding;
import www.modules.ai.model.AiEntityType;
import www.modules.ai.repository.AiEmbeddingRepository;
import www.modules.ai.service.context.CatalogContextProvider;
import www.modules.ai.service.context.PolicyKnowledge;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.BrandRepository;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.PublicStatus;
import www.modules.common.EcommerceEnums.VariantStatus;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.repository.InventoryRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiIndexService {
    private final AiEmbeddingRepository embeddingRepository;
    private final OpenAiEmbeddingAdapter embeddingAdapter;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final BrandRepository brandRepository;
    private final InventoryRepository inventoryRepository;
    private final PolicyKnowledge policyKnowledge;

    @Async
    public void indexProductAsync(String productId) {
        try {
            indexProduct(productId);
        } catch (Exception ex) {
            log.warn("Failed to AI-index product {}: {}", productId, ex.getMessage());
        }
    }

    public void indexProduct(String productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || Boolean.TRUE.equals(product.getDeleted())
                || product.getPublicStatus() != PublicStatus.PUBLISHED) {
            embeddingRepository.deleteByEntityTypeAndEntityId(AiEntityType.PRODUCT, productId);
            return;
        }
        String text = buildProductText(product);
        List<Double> embedding = embeddingAdapter.embed(text);
        if (embedding.isEmpty()) {
            return;
        }
        save(AiEntityType.PRODUCT, productId, text, embedding);
    }

    public int reindexAllProducts() {
        List<Product> products = productRepository.findByStatusAndPublicStatusAndDeletedFalse(
                www.modules.common.EcommerceEnums.ProductStatus.PUBLISHED,
                PublicStatus.PUBLISHED,
                PageRequest.of(0, 10_000)
        ).getContent();
        for (Product product : products) {
            indexProduct(product.getProductId());
        }
        return products.size();
    }

    public int indexAllPolicies() {
        int count = 0;
        for (String key : policyKnowledge.getPolicies().keySet()) {
            String text = policyKnowledge.fullText(key);
            List<Double> embedding = embeddingAdapter.embed(text);
            if (!embedding.isEmpty()) {
                save(AiEntityType.POLICY, key, text, embedding);
                count++;
            }
        }
        return count;
    }

    public void ensureIndexed() {
        if (!embeddingAdapter.isConfigured()) {
            return;
        }
        if (embeddingRepository.count() == 0) {
            log.info("AI embeddings empty — indexing policies and published products");
            indexAllPolicies();
            reindexAllProducts();
        }
    }

    private void save(AiEntityType entityType, String entityId, String text, List<Double> embedding) {
        AiEmbedding doc = AiEmbedding.builder()
                .id(AiEmbedding.compositeId(entityType, entityId))
                .entityType(entityType)
                .entityId(entityId)
                .text(text)
                .embedding(embedding)
                .updatedAt(LocalDateTime.now())
                .build();
        embeddingRepository.save(doc);
    }

    private String buildProductText(Product product) {
        String brandName = product.getBrandId() != null
                ? brandRepository.findById(product.getBrandId()).map(b -> b.getName()).orElse("")
                : "";
        List<ProductVariant> variants = variantRepository.findByProductId(product.getProductId()).stream()
                .filter(v -> v.getStatus() == VariantStatus.ACTIVE)
                .toList();
        String variantText = variants.stream()
                .map(v -> {
                    int available = inventoryRepository
                            .findByVariantIdAndWarehouseId(v.getVariantId(), "default")
                            .map(Inventory::getAvailable)
                            .orElse(0);
                    return v.getSize() + "/" + v.getColorName() + " price=" + v.getPrice() + " available=" + available;
                })
                .collect(Collectors.joining("; "));
        double minPrice = variants.stream().mapToDouble(ProductVariant::getPrice).min().orElse(0);
        return String.join("\n",
                product.getName(),
                "brand: " + brandName,
                "slug: " + product.getSlug(),
                "minPrice: " + minPrice,
                product.getShortDescription() != null ? product.getShortDescription() : "",
                product.getDescription() != null ? product.getDescription() : "",
                product.getMaterial() != null ? "material: " + product.getMaterial() : "",
                "variants: " + variantText
        ).trim();
    }
}
