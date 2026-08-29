package www.modules.catalog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.model.dto.common.PageResponse;
import www.modules.catalog.dto.ProductDtos.*;
import www.modules.catalog.dto.ProductFilter;
import www.modules.catalog.model.*;
import www.modules.catalog.service.CatalogService;
import www.modules.common.EcommerceEnums.GenderTarget;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.util.PageUtils;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CatalogController {
    private final CatalogService catalogService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummary>>> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String brandId,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) GenderTarget gender,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String variantSize,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(catalogService.searchPublished(
                buildFilter(search, brandId, categoryId, gender, minPrice, maxPrice, variantSize, color, inStock, sort),
                PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))))));
    }

    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<PageResponse<ProductSummary>>> searchProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String brandId,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) GenderTarget gender,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String variantSize,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return products(search, brandId, categoryId, gender, minPrice, maxPrice, variantSize, color, inStock, sort, page, pageSize);
    }

    @GetMapping("/products/{idOrSlug}")
    public ResponseEntity<ApiResponse<Product>> product(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getProduct(idOrSlug)));
    }

    @GetMapping("/products/{productId}/related")
    public ResponseEntity<ApiResponse<List<ProductSummary>>> relatedProducts(
            @PathVariable String productId,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getRelatedProducts(productId, limit)));
    }

    @GetMapping("/products/{productId}/variants")
    public ResponseEntity<ApiResponse<List<VariantView>>> variants(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getPublicVariants(productId)));
    }

    @GetMapping("/admin/products/{productId}/variants")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<VariantView>>> adminVariants(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getAdminVariants(productId)));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<Brand>>> brands() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.brands()));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.categories()));
    }

    @GetMapping("/admin/products")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> adminProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) PublicStatus publicStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(PageUtils.toPageResponse(
                catalogService.getAdminProducts(search, status, publicStatus,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))))));
    }

    @PostMapping("/admin/products")
    @PreAuthorize("@perm.has(authentication, 'CATALOG_CREATE')")
    public ResponseEntity<ApiResponse<Product>> createProduct(
            @Valid @RequestBody ProductRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Product created",
                catalogService.createProduct(request, currentUserId(authentication))));
    }

    @PutMapping("/admin/products/{productId}")
    @PreAuthorize("@perm.has(authentication, 'CATALOG_UPDATE')")
    public ResponseEntity<ApiResponse<Product>> updateProduct(
            @PathVariable String productId, @Valid @RequestBody ProductRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", catalogService.updateProduct(productId, request)));
    }

    @PostMapping("/admin/products/{productId}/variants")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ProductVariant>> createVariant(
            @PathVariable String productId, @Valid @RequestBody VariantRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Variant created", catalogService.createVariant(productId, request)));
    }

    @PutMapping("/admin/products/{productId}/variants/{variantId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ProductVariant>> updateVariant(
            @PathVariable String productId,
            @PathVariable String variantId,
            @Valid @RequestBody VariantRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Variant updated",
                catalogService.updateVariant(productId, variantId, request)));
    }

    @DeleteMapping("/admin/products/{productId}/variants/{variantId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(
            @PathVariable String productId, @PathVariable String variantId) {
        catalogService.deleteVariant(productId, variantId);
        return ResponseEntity.ok(ApiResponse.success("Variant deleted", null));
    }

    @PostMapping("/admin/products/{productId}/approve")
    @PreAuthorize("@perm.has(authentication, 'CATALOG_APPROVE')")
    public ResponseEntity<ApiResponse<Product>> approve(@PathVariable String productId, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Product approved", catalogService.approve(productId, currentUserId(authentication))));
    }

    @PostMapping("/admin/products/{productId}/reject")
    @PreAuthorize("@perm.has(authentication, 'CATALOG_APPROVE')")
    public ResponseEntity<ApiResponse<Product>> reject(
            @PathVariable String productId,
            @RequestParam(required = false) String reason,
            @RequestBody(required = false) RejectProductRequest body,
            Authentication authentication) {
        String rejectionReason = reason != null && !reason.isBlank()
                ? reason
                : body != null && body.getReason() != null ? body.getReason() : "Rejected";
        return ResponseEntity.ok(ApiResponse.success("Product rejected",
                catalogService.reject(productId, rejectionReason, currentUserId(authentication))));
    }

    @PostMapping("/admin/products/{productId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Product>> publish(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success("Product published", catalogService.publish(productId)));
    }

    @PostMapping("/admin/products/{productId}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Product>> unpublish(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success("Product unpublished", catalogService.unpublish(productId)));
    }

    @DeleteMapping("/admin/products/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String productId) {
        catalogService.softDelete(productId);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }

    @PostMapping("/admin/products/{productId}/restore")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Product>> restore(@PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success("Product restored", catalogService.restore(productId)));
    }

    @PostMapping("/admin/brands")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Brand>> createBrand(@Valid @RequestBody BrandRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Brand created", catalogService.createBrand(request)));
    }

    @PutMapping("/admin/brands/{brandId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Brand>> updateBrand(
            @PathVariable String brandId, @Valid @RequestBody BrandRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Brand updated", catalogService.updateBrand(brandId, request)));
    }

    @DeleteMapping("/admin/brands/{brandId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable String brandId) {
        catalogService.deleteBrand(brandId);
        return ResponseEntity.ok(ApiResponse.success("Brand deleted", null));
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category created", catalogService.createCategory(request)));
    }

    @PutMapping("/admin/categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable String categoryId, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", catalogService.updateCategory(categoryId, request)));
    }

    @DeleteMapping("/admin/categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String categoryId) {
        catalogService.deleteCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }

    private ProductFilter buildFilter(String search, String brandId, String categoryId, GenderTarget gender,
                                      Double minPrice, Double maxPrice, String variantSize, String color,
                                      Boolean inStock, String sort) {
        ProductFilter filter = new ProductFilter();
        filter.setSearch(search);
        filter.setBrandId(brandId);
        filter.setCategoryId(categoryId);
        filter.setGender(gender);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setSize(variantSize);
        filter.setColor(color);
        filter.setInStock(inStock);
        filter.setSort(sort);
        return filter;
    }

    private String currentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return "system";
        }
        return ((UserPrincipal) authentication.getPrincipal()).getId();
    }
}
