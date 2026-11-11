package www.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import www.modules.catalog.model.Brand;
import www.modules.catalog.model.Category;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.BrandRepository;
import www.modules.catalog.repository.CategoryRepository;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.GenderTarget;
import www.modules.inventory.model.Inventory;
import www.modules.inventory.service.InventoryService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogSeedServiceTest {

    @Mock private BrandRepository brandRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private InventoryService inventoryService;

    private CatalogSeedService service;

    @BeforeEach
    void setUp() {
        service = new CatalogSeedService(
                brandRepository, categoryRepository, productRepository, variantRepository, inventoryService);
        ReflectionTestUtils.setField(service, "seedEnabled", true);
        ReflectionTestUtils.setField(service, "seedForce", false);
    }

    @Test
    void skipsWhenDisabled() {
        ReflectionTestUtils.setField(service, "seedEnabled", false);
        service.seedCatalogIfEmpty();
        verifyNoInteractions(brandRepository, categoryRepository, productRepository, variantRepository, inventoryService);
    }

    @Test
    void seedsRichCatalogAcrossBrandsCategoriesGendersSizesAndLowStock() {
        AtomicInteger idSeq = new AtomicInteger(1);
        when(brandRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(brandRepository.save(any())).thenAnswer(inv -> {
            Brand b = inv.getArgument(0);
            b.setBrandId("b-" + idSeq.getAndIncrement());
            return b;
        });

        when(categoryRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(categoryRepository.save(any())).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setCategoryId("c-" + idSeq.getAndIncrement());
            return c;
        });

        when(productRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(productRepository.save(any())).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setProductId("p-" + idSeq.getAndIncrement());
            return p;
        });

        Map<String, List<ProductVariant>> variantsByProduct = new HashMap<>();
        List<ProductVariant> allSavedVariants = new ArrayList<>();
        when(variantRepository.findByProductId(anyString()))
                .thenAnswer(inv -> variantsByProduct.getOrDefault(inv.getArgument(0), List.of()));
        when(variantRepository.save(any())).thenAnswer(inv -> {
            ProductVariant v = inv.getArgument(0);
            v.setVariantId("v-" + idSeq.getAndIncrement());
            variantsByProduct.computeIfAbsent(v.getProductId(), k -> new ArrayList<>()).add(v);
            allSavedVariants.add(v);
            return v;
        });

        when(inventoryService.ensureInventory(anyString(), anyInt()))
                .thenAnswer(inv -> Inventory.builder().variantId(inv.getArgument(0)).available(inv.getArgument(1)).build());

        service.seedCatalogIfEmpty();

        verify(variantRepository, never()).findBySku(anyString());

        ArgumentCaptor<Brand> brandCaptor = ArgumentCaptor.forClass(Brand.class);
        verify(brandRepository, atLeast(10)).save(brandCaptor.capture());
        assertThat(brandCaptor.getAllValues()).hasSizeGreaterThanOrEqualTo(11);

        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository, atLeast(8)).save(categoryCaptor.capture());
        assertThat(categoryCaptor.getAllValues()).hasSizeGreaterThanOrEqualTo(9);
        assertThat(categoryCaptor.getAllValues()).allSatisfy(c -> assertThat(c.getImageUrl()).isNotBlank());

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository, atLeast(24)).save(productCaptor.capture());
        List<Product> products = productCaptor.getAllValues();
        assertThat(products).hasSize(28);

        Set<GenderTarget> genders = products.stream().map(Product::getGenderTarget).collect(Collectors.toSet());
        assertThat(genders).containsExactlyInAnyOrder(
                GenderTarget.MEN, GenderTarget.WOMEN, GenderTarget.UNISEX, GenderTarget.KIDS);

        Set<String> sizes = allSavedVariants.stream().map(ProductVariant::getSize).collect(Collectors.toSet());
        assertThat(sizes).contains("36", "37", "38", "39", "40", "41", "42", "43", "44", "45");

        ArgumentCaptor<Integer> stockCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(inventoryService, atLeastOnce()).ensureInventory(anyString(), stockCaptor.capture());
        assertThat(stockCaptor.getAllValues().stream().filter(stock -> stock <= 3).count())
                .isGreaterThanOrEqualTo(2);
    }

    @Test
    void upsertsOnlyMissingProductsWhenExistingTwelveHaveCrossProductDuplicateSkus() {
        List<String> allSlugs = CatalogSeedService.seedProductSlugs();
        Set<String> existingSlugs = Set.copyOf(allSlugs.subList(0, 12));

        when(brandRepository.findBySlug(anyString())).thenAnswer(inv ->
                Optional.of(Brand.builder().brandId("b-" + inv.getArgument(0)).slug(inv.getArgument(0)).build()));
        when(categoryRepository.findBySlug(anyString())).thenAnswer(inv ->
                Optional.of(Category.builder()
                        .categoryId("c-" + inv.getArgument(0))
                        .slug(inv.getArgument(0))
                        .name("Custom Name")
                        .imageUrl("https://res.cloudinary.com/demo/image/upload/cat.webp")
                        .build()));

        when(productRepository.findBySlug(anyString())).thenAnswer(inv -> {
            String slug = inv.getArgument(0);
            if (existingSlugs.contains(slug)) {
                return Optional.of(Product.builder()
                        .productId("existing-" + slug)
                        .slug(slug)
                        .imageUrls(List.of("https://res.cloudinary.com/demo/image/upload/p.webp"))
                        .build());
            }
            return Optional.empty();
        });
        when(productRepository.save(any())).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setProductId("new-" + p.getSlug());
            return p;
        });

        // Simulate legacy duplicate SKUs across two existing Nike products (NIKE-WHT-40 on both)
        when(variantRepository.findByProductId(anyString())).thenAnswer(inv -> {
            String productId = inv.getArgument(0);
            if ("existing-nike-air-max-90".equals(productId) || "existing-nike-air-force-1-07".equals(productId)) {
                return List.of(ProductVariant.builder()
                        .variantId("v-" + productId + "-wht-40")
                        .productId(productId)
                        .sku("NIKE-WHT-40")
                        .build());
            }
            return List.of();
        });
        when(variantRepository.save(any())).thenAnswer(inv -> {
            ProductVariant v = inv.getArgument(0);
            v.setVariantId("v-" + v.getSku());
            return v;
        });

        service.seedCatalogIfEmpty();

        verify(variantRepository, never()).findBySku(anyString());
        ArgumentCaptor<Product> savedProducts = ArgumentCaptor.forClass(Product.class);
        verify(productRepository, times(allSlugs.size() - 12)).save(savedProducts.capture());
        assertThat(savedProducts.getAllValues())
                .extracting(Product::getSlug)
                .doesNotContainAnyElementsOf(existingSlugs);
        verify(brandRepository, never()).save(any());
        verify(categoryRepository, never()).save(any());
        // NIKE-WHT-40 existed on nike-air-max-90 so its inventory is ensured without re-saving the variant
        verify(inventoryService).ensureInventory(eq("v-existing-nike-air-max-90-wht-40"), anyInt());
        verify(inventoryService).ensureInventory(eq("v-existing-nike-air-force-1-07-wht-40"), anyInt());
    }

    @Test
    void isStrictlyIdempotentWhenAllSeedRecordsExist() {
        when(brandRepository.findBySlug(anyString())).thenAnswer(inv ->
                Optional.of(Brand.builder().brandId("b-" + inv.getArgument(0)).slug(inv.getArgument(0)).build()));
        when(categoryRepository.findBySlug(anyString())).thenAnswer(inv ->
                Optional.of(Category.builder()
                        .categoryId("c-" + inv.getArgument(0))
                        .slug(inv.getArgument(0))
                        .imageUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80")
                        .build()));

        // Capture full expected variant SKUs per product via a seeded in-memory run first
        Map<String, String> slugToProductId = new HashMap<>();
        when(productRepository.findBySlug(anyString())).thenAnswer(inv -> {
            String slug = inv.getArgument(0);
            String pid = slugToProductId.computeIfAbsent(slug, s -> "p-" + s);
            return Optional.of(Product.builder()
                    .productId(pid)
                    .slug(slug)
                    .imageUrls(List.of("https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"))
                    .build());
        });

        // Build all expected variants per product dynamically by simulating once on empty map
        CatalogSeedService collectorService = new CatalogSeedService(
                brandRepository, categoryRepository, productRepository, variantRepository, inventoryService);
        ReflectionTestUtils.setField(collectorService, "seedEnabled", true);
        ReflectionTestUtils.setField(collectorService, "seedForce", false);

        Map<String, List<ProductVariant>> allExistingVariants = new HashMap<>();
        when(variantRepository.findByProductId(anyString())).thenReturn(List.of());
        when(variantRepository.save(any())).thenAnswer(inv -> {
            ProductVariant v = inv.getArgument(0);
            v.setVariantId("v-" + v.getProductId() + "-" + v.getSku());
            allExistingVariants.computeIfAbsent(v.getProductId(), k -> new ArrayList<>()).add(v);
            return v;
        });
        collectorService.seedCatalogIfEmpty();

        clearInvocations(brandRepository, categoryRepository, productRepository, variantRepository, inventoryService);
        when(variantRepository.findByProductId(anyString()))
                .thenAnswer(inv -> allExistingVariants.getOrDefault(inv.getArgument(0), List.of()));

        service.seedCatalogIfEmpty();

        verify(variantRepository, never()).findBySku(anyString());
        verify(brandRepository, never()).save(any());
        verify(categoryRepository, never()).save(any());
        verify(productRepository, never()).save(any());
        verify(variantRepository, never()).save(any());
    }
}
