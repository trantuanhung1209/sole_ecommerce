package www.modules.catalog.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.exception.NotFoundException;
import www.modules.catalog.dto.ProductDtos.*;
import www.modules.catalog.dto.ProductFilter;
import www.modules.catalog.model.*;
import www.modules.catalog.repository.*;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;
import www.modules.common.EcommerceEnums.VariantStatus;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.service.InventoryService;
import www.modules.reviews.repository.ProductReviewRepository;
import www.modules.search.port.ProductSearchPort;
import www.modules.search.service.SearchIndexService;
import www.modules.ai.service.AiIndexService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;
    private final ProductReviewRepository reviewRepository;
    private final ProductSearchPort productSearchPort;
    private final SearchIndexService searchIndexService;
    private final AiIndexService aiIndexService;

    public Page<ProductSummary> getPublishedProductSummaries(String search, Pageable pageable) {
        ProductFilter filter = new ProductFilter();
        filter.setSearch(search);
        filter.setSort("newest");
        return searchPublished(filter, pageable);
    }

    public Page<ProductSummary> searchPublished(ProductFilter filter, Pageable pageable) {
        return productSearchPort.search(filter, pageable);
    }

    public Page<ProductSummary> searchPublishedMongo(ProductFilter filter, Pageable pageable) {
        List<Product> products = loadPublishedCandidates(filter.getSearch());
        List<ProductSummary> summaries = products.stream()
                .filter(p -> matchesBasicFilter(p, filter))
                .map(this::toSummary)
                .filter(s -> matchesVariantFilter(s.getProductId(), filter))
                .collect(Collectors.toCollection(ArrayList::new));

        sortSummaries(summaries, filter.getSort());
        return paginate(summaries, pageable);
    }

    public Page<Product> getAdminProducts(String search, ProductStatus status, PublicStatus publicStatus, Pageable pageable) {
        List<Product> candidates;
        if (search != null && !search.isBlank()) {
            candidates = productRepository.search(search.trim(), Pageable.unpaged()).getContent();
        } else {
            candidates = productRepository.findByDeletedFalse(Pageable.unpaged()).getContent();
        }
        List<Product> filtered = candidates.stream()
                .filter(product -> !Boolean.TRUE.equals(product.getDeleted()))
                .filter(product -> status == null || product.getStatus() == status)
                .filter(product -> publicStatus == null || product.getPublicStatus() == publicStatus)
                .toList();
        return paginateProducts(filtered, pageable);
    }

    private Page<Product> paginateProducts(List<Product> items, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), items.size());
        if (start > items.size()) {
            return new PageImpl<>(List.of(), pageable, items.size());
        }
        return new PageImpl<>(items.subList(start, end), pageable, items.size());
    }

    public Product getProduct(String idOrSlug) {
        return productRepository.findById(idOrSlug)
                .or(() -> productRepository.findBySlug(idOrSlug))
                .orElseThrow(() -> new NotFoundException("Product not found: " + idOrSlug));
    }

    public Product createProduct(ProductRequest request, String userId) {
        LocalDateTime now = LocalDateTime.now();
        Product product = Product.builder()
                .name(request.getName())
                .slug(slugOrDefault(request.getSlug(), request.getName()))
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .brandId(request.getBrandId())
                .categoryIds(request.getCategoryIds())
                .genderTarget(request.getGenderTarget())
                .material(request.getMaterial())
                .careInstruction(request.getCareInstruction())
                .imageUrls(request.getImageUrls())
                .status(ProductStatus.PENDING_APPROVAL)
                .publicStatus(PublicStatus.DRAFT)
                .createdBy(userId)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return productRepository.save(product);
    }

    public Product updateProduct(String productId, ProductRequest request) {
        Product product = getProduct(productId);
        product.setName(request.getName());
        product.setSlug(slugOrDefault(request.getSlug(), request.getName()));
        product.setDescription(request.getDescription());
        product.setShortDescription(request.getShortDescription());
        product.setBrandId(request.getBrandId());
        product.setCategoryIds(request.getCategoryIds());
        product.setGenderTarget(request.getGenderTarget());
        product.setMaterial(request.getMaterial());
        product.setCareInstruction(request.getCareInstruction());
        product.setImageUrls(request.getImageUrls());
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public Product approve(String productId, String adminId) {
        Product product = getProduct(productId);
        product.setStatus(ProductStatus.APPROVED);
        product.setApprovedBy(adminId);
        product.setApprovedAt(LocalDateTime.now());
        product.setRejectionReason(null);
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public Product reject(String productId, String reason, String adminId) {
        Product product = getProduct(productId);
        product.setStatus(ProductStatus.REJECTED);
        product.setApprovedBy(adminId);
        product.setApprovedAt(LocalDateTime.now());
        product.setRejectionReason(reason);
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public Product publish(String productId) {
        Product product = getProduct(productId);
        if (product.getStatus() != ProductStatus.APPROVED && product.getStatus() != ProductStatus.PUBLISHED) {
            throw new BadRequestException("Sản phẩm phải được duyệt trước khi xuất bản");
        }
        List<ProductVariant> variants = variantRepository.findByProductId(productId);
        List<ProductVariant> activeVariants = variants.stream()
                .filter(v -> v.getStatus() == null || v.getStatus() == VariantStatus.ACTIVE)
                .toList();
        if (activeVariants.isEmpty()) {
            throw new BadRequestException("Sản phẩm cần ít nhất một biến thể đang hoạt động để xuất bản");
        }
        boolean productHasImages = product.getImageUrls() != null && !product.getImageUrls().isEmpty();
        if (!productHasImages) {
            boolean allActiveHaveImages = activeVariants.stream()
                    .allMatch(v -> v.getImageUrls() != null && !v.getImageUrls().isEmpty());
            if (!allActiveHaveImages) {
                throw new BadRequestException(
                        "Sản phẩm cần có ảnh hoặc mỗi biến thể đang hoạt động phải có ít nhất một ảnh");
            }
        }
        product.setStatus(ProductStatus.PUBLISHED);
        product.setPublicStatus(PublicStatus.PUBLISHED);
        product.setUpdatedAt(LocalDateTime.now());
        Product saved = productRepository.save(product);
        searchIndexService.indexProductAsync(productId);
        aiIndexService.indexProductAsync(productId);
        return saved;
    }

    public Product unpublish(String productId) {
        Product product = getProduct(productId);
        product.setStatus(ProductStatus.UNPUBLISHED);
        product.setPublicStatus(PublicStatus.HIDDEN);
        product.setUpdatedAt(LocalDateTime.now());
        Product saved = productRepository.save(product);
        searchIndexService.indexProductAsync(productId);
        aiIndexService.indexProductAsync(productId);
        return saved;
    }

    public void softDelete(String productId) {
        Product product = getProduct(productId);
        product.setDeleted(true);
        product.setPublicStatus(PublicStatus.HIDDEN);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
        searchIndexService.indexProductAsync(productId);
        aiIndexService.indexProductAsync(productId);
    }

    public Product restore(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        product.setDeleted(false);
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public ProductVariant createVariant(String productId, VariantRequest request) {
        Product product = getProduct(productId);
        LocalDateTime now = LocalDateTime.now();
        List<String> imageUrls = request.getImageUrls();
        if (imageUrls == null || imageUrls.isEmpty()) {
            imageUrls = product.getImageUrls() != null ? new ArrayList<>(product.getImageUrls()) : new ArrayList<>();
        }
        ProductVariant variant = ProductVariant.builder()
                .productId(product.getProductId())
                .sku(request.getSku())
                .size(request.getSize())
                .colorName(request.getColorName())
                .colorHex(request.getColorHex())
                .price(request.getPrice())
                .compareAtPrice(request.getCompareAtPrice())
                .costPrice(request.getCostPrice())
                .weight(request.getWeight())
                .imageUrls(imageUrls)
                .createdAt(now)
                .updatedAt(now)
                .build();
        ProductVariant saved = variantRepository.save(variant);
        inventoryService.ensureInventory(saved.getVariantId(), Math.max(0, request.getInitialStock()));
        return saved;
    }

    public ProductVariant updateVariant(String productId, String variantId, VariantRequest request) {
        ProductVariant variant = getVariant(productId, variantId);
        variant.setSku(request.getSku());
        variant.setSize(request.getSize());
        variant.setColorName(request.getColorName());
        variant.setColorHex(request.getColorHex());
        variant.setPrice(request.getPrice());
        variant.setCompareAtPrice(request.getCompareAtPrice());
        variant.setCostPrice(request.getCostPrice());
        variant.setWeight(request.getWeight());
        variant.setImageUrls(request.getImageUrls());
        variant.setUpdatedAt(LocalDateTime.now());
        return variantRepository.save(variant);
    }

    public void deleteVariant(String productId, String variantId) {
        ProductVariant variant = getVariant(productId, variantId);
        variant.setStatus(VariantStatus.INACTIVE);
        variant.setUpdatedAt(LocalDateTime.now());
        variantRepository.save(variant);
    }

    private ProductVariant getVariant(String productId, String variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId));
        if (!productId.equals(variant.getProductId())) {
            throw new BadRequestException("Variant does not belong to product");
        }
        return variant;
    }

    public List<ProductVariant> getVariants(String productId) {
        return variantRepository.findByProductId(productId);
    }

    public List<VariantView> getPublicVariants(String productIdOrSlug) {
        Product product = getProduct(productIdOrSlug);
        return variantRepository.findByProductId(product.getProductId()).stream()
                .filter(v -> v.getStatus() == null || v.getStatus() == VariantStatus.ACTIVE)
                .map(this::toVariantView)
                .toList();
    }

    public List<VariantView> getAdminVariants(String productId) {
        getProduct(productId);
        return variantRepository.findByProductId(productId).stream()
                .map(this::toVariantView)
                .toList();
    }

    private VariantView toVariantView(ProductVariant variant) {
        int onHand = 0;
        int reserved = 0;
        int available = 0;
        try {
            Inventory inv = inventoryService.getByVariant(variant.getVariantId());
            onHand = inv.getOnHand() != null ? inv.getOnHand() : 0;
            reserved = inv.getReserved() != null ? inv.getReserved() : 0;
            available = inv.getAvailable() != null ? inv.getAvailable() : 0;
        } catch (NotFoundException ignored) {
            // no inventory row yet
        }
        return VariantView.builder()
                .variantId(variant.getVariantId())
                .productId(variant.getProductId())
                .sku(variant.getSku())
                .size(variant.getSize())
                .colorName(variant.getColorName())
                .colorHex(variant.getColorHex())
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .imageUrls(variant.getImageUrls())
                .status(variant.getStatus() == null ? VariantStatus.ACTIVE.name() : variant.getStatus().name())
                .onHand(onHand)
                .reserved(reserved)
                .available(available)
                .build();
    }

    public Brand createBrand(BrandRequest request) {
        LocalDateTime now = LocalDateTime.now();
        return brandRepository.save(Brand.builder()
                .name(request.getName())
                .slug(slugOrDefault(request.getSlug(), request.getName()))
                .description(request.getDescription())
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    public Brand updateBrand(String brandId, BrandRequest request) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found: " + brandId));
        brand.setName(request.getName());
        brand.setSlug(slugOrDefault(request.getSlug(), request.getName()));
        brand.setDescription(request.getDescription());
        brand.setUpdatedAt(LocalDateTime.now());
        return brandRepository.save(brand);
    }

    public void deleteBrand(String brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found: " + brandId));
        brandRepository.delete(brand);
    }

    public Category createCategory(CategoryRequest request) {
        LocalDateTime now = LocalDateTime.now();
        return categoryRepository.save(Category.builder()
                .name(request.getName())
                .slug(slugOrDefault(request.getSlug(), request.getName()))
                .description(request.getDescription())
                .parentId(request.getParentId())
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    public Category updateCategory(String categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found: " + categoryId));
        category.setName(request.getName());
        category.setSlug(slugOrDefault(request.getSlug(), request.getName()));
        category.setDescription(request.getDescription());
        category.setParentId(request.getParentId());
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public void deleteCategory(String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found: " + categoryId));
        categoryRepository.delete(category);
    }

    public List<Brand> brands() {
        return brandRepository.findAll();
    }

    public List<Category> categories() {
        return categoryRepository.findAll();
    }

    private ProductSummary toSummary(Product product) {
        List<ProductVariant> variants = variantRepository.findByProductId(product.getProductId());
        double minPrice = variants.stream()
                .map(ProductVariant::getPrice)
                .filter(price -> price != null && price > 0)
                .mapToDouble(Double::doubleValue)
                .min()
                .orElse(0);
        Double compareAtPrice = variants.stream()
                .map(ProductVariant::getCompareAtPrice)
                .filter(price -> price != null && price > 0)
                .max(Double::compare)
                .orElse(null);
        String brandName = product.getBrandId() == null ? null
                : brandRepository.findById(product.getBrandId()).map(Brand::getName).orElse(null);

        return ProductSummary.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .slug(product.getSlug())
                .shortDescription(product.getShortDescription())
                .brandId(product.getBrandId())
                .brandName(brandName)
                .categoryIds(product.getCategoryIds())
                .genderTarget(product.getGenderTarget() == null ? null : product.getGenderTarget().name())
                .imageUrls(product.getImageUrls())
                .minPrice(minPrice)
                .compareAtPrice(compareAtPrice)
                .status(product.getStatus() == null ? null : product.getStatus().name())
                .publicStatus(product.getPublicStatus() == null ? null : product.getPublicStatus().name())
                .build();
    }

    private List<Product> loadPublishedCandidates(String search) {
        if (search != null && !search.isBlank()) {
            return productRepository.searchPublished(search.trim(), Pageable.unpaged()).getContent();
        }
        return productRepository.findByStatusAndPublicStatusAndDeletedFalse(
                ProductStatus.PUBLISHED, PublicStatus.PUBLISHED, Pageable.unpaged()).getContent();
    }

    private boolean matchesBasicFilter(Product product, ProductFilter filter) {
        if (filter.getBrandId() != null && !filter.getBrandId().equals(product.getBrandId())) {
            return false;
        }
        if (filter.getCategoryId() != null
                && (product.getCategoryIds() == null || !product.getCategoryIds().contains(filter.getCategoryId()))) {
            return false;
        }
        return filter.getGender() == null || filter.getGender() == product.getGenderTarget();
    }

    private boolean matchesVariantFilter(String productId, ProductFilter filter) {
        List<ProductVariant> variants = variantRepository.findByProductId(productId).stream()
                .filter(v -> v.getStatus() == VariantStatus.ACTIVE)
                .toList();
        if (variants.isEmpty()) {
            return false;
        }
        if (filter.getSize() != null && variants.stream().noneMatch(v -> filter.getSize().equalsIgnoreCase(v.getSize()))) {
            return false;
        }
        if (filter.getColor() != null && variants.stream().noneMatch(v -> filter.getColor().equalsIgnoreCase(v.getColorName()))) {
            return false;
        }
        if (filter.getMinPrice() != null || filter.getMaxPrice() != null) {
            boolean priceMatch = variants.stream().anyMatch(v -> {
                double price = v.getPrice() != null ? v.getPrice() : 0;
                if (filter.getMinPrice() != null && price < filter.getMinPrice()) return false;
                if (filter.getMaxPrice() != null && price > filter.getMaxPrice()) return false;
                return true;
            });
            if (!priceMatch) return false;
        }
        if (Boolean.TRUE.equals(filter.getInStock())) {
            return variants.stream().anyMatch(v -> {
                try {
                    Inventory inv = inventoryService.getByVariant(v.getVariantId());
                    return inv.getAvailable() > 0;
                } catch (NotFoundException e) {
                    return false;
                }
            });
        }
        return true;
    }

    private void sortSummaries(List<ProductSummary> summaries, String sort) {
        if (sort == null || "newest".equalsIgnoreCase(sort)) {
            return;
        }
        if ("price_asc".equalsIgnoreCase(sort)) {
            summaries.sort(Comparator.comparingDouble(s -> s.getMinPrice() != null ? s.getMinPrice() : 0));
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            summaries.sort(Comparator.comparingDouble((ProductSummary s) -> s.getMinPrice() != null ? s.getMinPrice() : 0).reversed());
        } else if ("rating".equalsIgnoreCase(sort)) {
            Map<String, Double> avgRatings = new HashMap<>();
            for (ProductSummary summary : summaries) {
                avgRatings.put(summary.getProductId(), reviewRepository.findByProductIdAndVisibleTrue(summary.getProductId())
                        .stream().mapToInt(r -> r.getRating() != null ? r.getRating() : 0).average().orElse(0));
            }
            summaries.sort(Comparator.<ProductSummary>comparingDouble(
                    s -> avgRatings.getOrDefault(s.getProductId(), 0.0)).reversed());
        }
    }

    private Page<ProductSummary> paginate(List<ProductSummary> items, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), items.size());
        if (start > items.size()) {
            return new PageImpl<>(List.of(), pageable, items.size());
        }
        return new PageImpl<>(items.subList(start, end), pageable, items.size());
    }

    public List<ProductSummary> getRelatedProducts(String productIdOrSlug, int limit) {
        Product product = getProduct(productIdOrSlug);
        List<String> categoryIds = product.getCategoryIds() != null ? product.getCategoryIds() : List.of();
        if (categoryIds.isEmpty()) {
            return List.of();
        }
        ProductFilter filter = new ProductFilter();
        filter.setSort("newest");
        return searchPublished(filter, PageRequest.of(0, 200)).getContent().stream()
                .filter(s -> !s.getProductId().equals(product.getProductId()))
                .filter(s -> s.getCategoryIds() != null && s.getCategoryIds().stream().anyMatch(categoryIds::contains))
                .limit(Math.max(1, limit))
                .toList();
    }

    private String slugOrDefault(String slug, String name) {
        String source = slug == null || slug.isBlank() ? name : slug;
        return source.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }
}
