package www.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import www.modules.catalog.model.Brand;
import www.modules.catalog.model.Category;
import www.modules.catalog.model.Product;
import www.modules.catalog.model.ProductVariant;
import www.modules.catalog.repository.BrandRepository;
import www.modules.catalog.repository.CategoryRepository;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.GenderTarget;
import www.modules.common.EcommerceEnums.ProductStatus;
import www.modules.common.EcommerceEnums.PublicStatus;
import www.modules.common.EcommerceEnums.VariantStatus;
import www.modules.inventory.service.InventoryService;
import www.modules.search.service.SearchIndexService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogSeedService {

    private static String unsplash(String photoId, int width) {
        return "https://images.unsplash.com/%s?auto=format&fit=crop&w=%d&q=80".formatted(photoId, width);
    }

    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryService inventoryService;
    private final SearchIndexService searchIndexService;

    @Value("${catalog.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${catalog.seed.force:false}")
    private boolean seedForce;

    @PostConstruct
    public void seedCatalogIfEmpty() {
        if (!seedEnabled) {
            log.info("Catalog seed disabled");
            return;
        }
        try {
            if (productRepository.count() > 0) {
                if (seedForce) {
                    int updated = refreshCatalogFromSeed();
                    log.info("Catalog seed refresh — {} products updated with image URLs", updated);
                } else {
                    log.info("Catalog seed skipped — {} products already exist", productRepository.count());
                }
                return;
            }
            int products = seedCatalog();
            log.info("Catalog seed complete — {} products ready for UI testing", products);
        } catch (DataAccessException e) {
            log.warn("Skip catalog seed because database is not ready: {}", e.getMessage());
        }
    }

    private int refreshCatalogFromSeed() {
        LocalDateTime now = LocalDateTime.now();
        seedBrands(now);
        seedCategories(now);

        int updated = 0;
        for (SeedProduct seed : catalogProducts()) {
            Optional<Product> existing = productRepository.findBySlug(seed.slug());
            if (existing.isEmpty()) {
                continue;
            }
            Product product = existing.get();
            product.setImageUrls(List.of(seed.imageUrl()));
            product.setUpdatedAt(now);
            productRepository.save(product);

            for (ProductVariant variant : variantRepository.findByProductId(product.getProductId())) {
                variant.setImageUrls(List.of(seed.imageUrl()));
                variant.setUpdatedAt(now);
                variantRepository.save(variant);
            }
            updated++;
        }

        try {
            int indexed = searchIndexService.reindexAll();
            log.info("Search index refreshed — {} published products", indexed);
        } catch (IOException e) {
            log.warn("Search reindex after catalog refresh failed: {}", e.getMessage());
        }
        return updated;
    }

    private int seedCatalog() {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Brand> brands = seedBrands(now);
        Map<String, Category> categories = seedCategories(now);

        int count = 0;
        for (SeedProduct seed : catalogProducts()) {
            Brand brand = brands.get(seed.brandSlug());
            List<String> categoryIds = seed.categorySlugs().stream()
                    .map(slug -> categories.get(slug).getCategoryId())
                    .toList();

            Product product = productRepository.save(Product.builder()
                    .name(seed.name())
                    .slug(seed.slug())
                    .shortDescription(seed.shortDescription())
                    .description(seed.description())
                    .brandId(brand.getBrandId())
                    .categoryIds(new ArrayList<>(categoryIds))
                    .genderTarget(seed.gender())
                    .material("Da / vải / cao su tổng hợp")
                    .careInstruction("Lau khô, tránh giặt máy, phơi nơi thoáng mát.")
                    .imageUrls(List.of(seed.imageUrl()))
                    .status(ProductStatus.PUBLISHED)
                    .publicStatus(PublicStatus.PUBLISHED)
                    .createdBy("system")
                    .approvedBy("system")
                    .approvedAt(now)
                    .deleted(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());

            for (SeedVariant color : seed.variants()) {
                for (int size = color.sizeFrom(); size <= color.sizeTo(); size++) {
                    String sku = "%s-%s-%d".formatted(
                            brand.getSlug().toUpperCase(Locale.ROOT).replace("-", ""),
                            color.code(),
                            size);
                    ProductVariant variant = variantRepository.save(ProductVariant.builder()
                            .productId(product.getProductId())
                            .sku(sku)
                            .size(String.valueOf(size))
                            .colorName(color.colorName())
                            .colorHex(color.colorHex())
                            .price((double) seed.basePrice())
                            .compareAtPrice(seed.basePrice() * 1.12)
                            .costPrice(seed.basePrice() * 0.55)
                            .weight(0.85)
                            .imageUrls(List.of(seed.imageUrl()))
                            .status(VariantStatus.ACTIVE)
                            .createdAt(now)
                            .updatedAt(now)
                            .build());
                    inventoryService.ensureInventory(variant.getVariantId(), 15 + size);
                }
            }
            count++;
        }
        return count;
    }

    private Map<String, Brand> seedBrands(LocalDateTime now) {
        List<String[]> data = List.of(
                new String[]{"Nike", "nike", "Thương hiệu thể thao hàng đầu thế giới."},
                new String[]{"Adidas", "adidas", "Ba sọc — biểu tượng performance và streetwear."},
                new String[]{"New Balance", "new-balance", "Made in USA heritage, comfort-first."},
                new String[]{"Jordan", "jordan", "Dòng giày bóng rổ huyền thoại của Michael Jordan."},
                new String[]{"Converse", "converse", "Chuck Taylor — sneaker văn hóa đại chúng."},
                new String[]{"Vans", "vans", "Skate culture và lifestyle California."},
                new String[]{"ASICS", "asics", "Chạy bộ Nhật Bản, công nghệ GEL."},
                new String[]{"Puma", "puma", "Thể thao và street style từ Đức."}
        );
        Map<String, Brand> brands = new LinkedHashMap<>();
        for (String[] row : data) {
            Brand brand = brandRepository.findBySlug(row[1]).orElseGet(() -> brandRepository.save(Brand.builder()
                    .name(row[0])
                    .slug(row[1])
                    .description(row[2])
                    .active(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build()));
            brands.put(row[1], brand);
        }
        return brands;
    }

    private Map<String, Category> seedCategories(LocalDateTime now) {
        List<String[]> data = List.of(
                new String[]{"Running", "running", "Giày chạy bộ, đệm êm, hỗ trợ tốc độ.",
                        unsplash("photo-1579338559199-fd52370f5f0b", 800)},
                new String[]{"Lifestyle", "lifestyle", "Sneaker phong cách hàng ngày, dễ phối đồ.",
                        unsplash("photo-1595950653106-6c9ebd614d3a", 800)},
                new String[]{"Basketball", "basketball", "High-top và performance court shoes.",
                        unsplash("photo-1556906781-219acccafc3d", 800)},
                new String[]{"Skate", "skate", "Đế bền, grip tốt cho skate và street.",
                        unsplash("photo-1549298916-b41d501d3772", 800)},
                new String[]{"Trail", "trail", "Chạy địa hình, grip và chống nước.",
                        unsplash("photo-1552674605-db6ffd4facb5", 800)},
                new String[]{"Kids", "kids", "Size nhỏ cho trẻ em.",
                        unsplash("photo-1514986888352-a0d648402806", 800)}
        );
        Map<String, Category> categories = new LinkedHashMap<>();
        for (String[] row : data) {
            Category category = categoryRepository.findBySlug(row[1]).map(existing -> {
                existing.setName(row[0]);
                existing.setDescription(row[2]);
                existing.setImageUrl(row[3]);
                existing.setUpdatedAt(now);
                return categoryRepository.save(existing);
            }).orElseGet(() -> categoryRepository.save(Category.builder()
                    .name(row[0])
                    .slug(row[1])
                    .description(row[2])
                    .imageUrl(row[3])
                    .active(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build()));
            categories.put(row[1], category);
        }
        return categories;
    }

    private static List<SeedProduct> catalogProducts() {
        return List.of(
                product("Nike Air Max 90", "nike-air-max-90", "Nike",
                        "Lifestyle sneaker kinh điển với đế Air visible.", "Đế Air, upper da + mesh, phong cách retro.",
                        "nike", List.of("lifestyle"), GenderTarget.UNISEX,
                        unsplash("photo-1542291026-7eec264c27ff", 900),
                        2890000, List.of(
                                variant("WHT", "Trắng", "#F5F5F5", 40, 42),
                                variant("BLK", "Đen", "#111111", 40, 43))),
                product("Adidas Ultraboost 22", "adidas-ultraboost-22", "Adidas",
                        "Giày chạy bộ premium với đệm Boost siêu êm.", "Boost midsole, Primeknit upper, hỗ trợ chạy đường dài.",
                        "adidas", List.of("running"), GenderTarget.MEN,
                        unsplash("photo-1600185365926-3a2a3fffb239", 900),
                        3990000, List.of(
                                variant("BLK", "Core Black", "#1A1A1A", 40, 43),
                                variant("WHT", "Cloud White", "#EFEFEF", 41, 44))),
                product("New Balance 550", "new-balance-550", "New Balance",
                        "Basketball-inspired lifestyle với tỷ lệ vintage hoàn hảo.", "Leather upper, logo N cổ điển, dễ phối đồ.",
                        "new-balance", List.of("lifestyle", "basketball"), GenderTarget.UNISEX,
                        unsplash("photo-1607522373035-fca363b37afb", 900),
                        2690000, List.of(
                                variant("GRN", "Green", "#2F5D3A", 39, 42),
                                variant("WHT", "White", "#F8F8F8", 40, 43))),
                product("Air Jordan 1 Retro High", "air-jordan-1-retro-high", "Jordan",
                        "Huyền thoại bóng rổ với silhouette High OG.", "High-top leather, Wings logo, biểu tượng streetwear.",
                        "jordan", List.of("basketball"), GenderTarget.MEN,
                        unsplash("photo-1556906781-219acccafc3d", 900),
                        4590000, List.of(
                                variant("RED", "Chicago", "#C62D42", 40, 43),
                                variant("BLK", "Black Toe", "#111111", 41, 44))),
                product("Converse Chuck 70 High", "converse-chuck-70-high", "Converse",
                        "Phiên bản cao cấp của Chuck Taylor cổ điển.", "Canvas dày hơn, đế OrthoLite, form high-top.",
                        "converse", List.of("lifestyle", "skate"), GenderTarget.UNISEX,
                        unsplash("photo-1606107556682-07f80f20e3a1", 900),
                        1890000, List.of(
                                variant("BLK", "Đen", "#111111", 38, 42),
                                variant("WHT", "Trắng", "#FFFFFF", 39, 43))),
                product("Vans Old Skool", "vans-old-skool", "Vans",
                        "Biểu tượng skate với sọc Jazz Stripe.", "Suede/canvas, waffle outsole, phong cách street.",
                        "vans", List.of("skate", "lifestyle"), GenderTarget.UNISEX,
                        unsplash("photo-1549298916-b41d501d3772", 900),
                        1790000, List.of(
                                variant("BLK", "Black/White", "#111111", 38, 42),
                                variant("NVY", "Navy", "#1E3A5F", 39, 43))),
                product("Nike Dunk Low", "nike-dunk-low", "Nike",
                        "Dunk Low phối màu Panda — bestseller toàn cầu.", "Leather two-tone, đế cupsole, dễ mix-match.",
                        "nike", List.of("lifestyle"), GenderTarget.UNISEX,
                        unsplash("photo-1595950653106-6c9ebd614d3a", 900),
                        3290000, List.of(
                                variant("PND", "Panda", "#F5F5F5", 40, 43),
                                variant("GRY", "Grey Fog", "#B0B0B0", 41, 44))),
                product("Adidas Samba OG", "adidas-samba-og", "Adidas",
                        "Samba OG — sneaker bóng đá chuyển sang lifestyle.", "Suede T-toe, gum sole, form slim.",
                        "adidas", List.of("lifestyle"), GenderTarget.UNISEX,
                        unsplash("photo-1627222227344-550a5f798528", 900),
                        2490000, List.of(
                                variant("WHT", "White/Black", "#F8F8F8", 39, 42),
                                variant("GRN", "Collegiate Green", "#1F4D3A", 40, 43))),
                product("ASICS Gel-Kayano 14", "asics-gel-kayano-14", "ASICS",
                        "Retro runner Y2K với hệ thống GEL đệm êm.", "Mesh layered upper, đế GEL, vibe archive.",
                        "asics", List.of("running"), GenderTarget.UNISEX,
                        unsplash("photo-1579338559199-fd52370f5f0b", 900),
                        3590000, List.of(
                                variant("SLV", "Silver", "#C0C0C0", 40, 43),
                                variant("WHT", "Cream", "#F2E8D8", 41, 44))),
                product("Puma Suede Classic", "puma-suede-classic", "Puma",
                        "Suede Classic — icon hip-hop từ thập niên 70.", "Suede upper, Formstrip, đế rubber.",
                        "puma", List.of("lifestyle"), GenderTarget.UNISEX,
                        unsplash("photo-1460353581641-37baddab0fa2", 900),
                        1590000, List.of(
                                variant("RED", "Team Regal Red", "#B91C1C", 39, 42),
                                variant("BLK", "Black", "#111111", 40, 43))),
                product("Nike Air Force 1 '07", "nike-air-force-1-07", "Nike",
                        "AF1 '07 — nền tảng của sneaker culture hiện đại.", "Full-grain leather, đế Air, form low.",
                        "nike", List.of("lifestyle", "basketball"), GenderTarget.UNISEX,
                        unsplash("photo-1599052902193-265dbcb38b8c", 900),
                        2790000, List.of(
                                variant("WHT", "Triple White", "#FFFFFF", 40, 43),
                                variant("BLK", "Triple Black", "#111111", 41, 44))),
                product("New Balance 2002R", "new-balance-2002r", "New Balance",
                        "2002R với đế N-ERGY + ABZORB — comfort tối đa.", "Mesh/suede mix, logo N lớn, phong cách dad shoe.",
                        "new-balance", List.of("running", "lifestyle"), GenderTarget.UNISEX,
                        unsplash("photo-1638243309727-d127a07cbb88", 900),
                        3190000, List.of(
                                variant("GRY", "Rain Cloud", "#A8A8A8", 40, 43),
                                variant("NVY", "Protection Pack Navy", "#1E2A44", 41, 44)))
        );
    }

    private static SeedProduct product(
            String name,
            String slug,
            String brandName,
            String shortDescription,
            String description,
            String brandSlug,
            List<String> categorySlugs,
            GenderTarget gender,
            String imageUrl,
            int basePrice,
            List<SeedVariant> variants) {
        return new SeedProduct(name, slug, brandName, shortDescription, description,
                brandSlug, categorySlugs, gender, imageUrl, basePrice, variants);
    }

    private static SeedVariant variant(String code, String colorName, String colorHex, int sizeFrom, int sizeTo) {
        return new SeedVariant(code, colorName, colorHex, sizeFrom, sizeTo);
    }

    private record SeedProduct(
            String name,
            String slug,
            String brandName,
            String shortDescription,
            String description,
            String brandSlug,
            List<String> categorySlugs,
            GenderTarget gender,
            String imageUrl,
            int basePrice,
            List<SeedVariant> variants) {
    }

    private record SeedVariant(String code, String colorName, String colorHex, int sizeFrom, int sizeTo) {
    }
}
