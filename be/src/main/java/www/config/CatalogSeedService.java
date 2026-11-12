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

    /** Category slug -> product slug whose image represents the category on Home. */
    private static final Map<String, String> CATEGORY_HERO_PRODUCT = Map.of(
            "running", "adidas-ultraboost-22",
            "lifestyle", "adidas-samba-og",
            "basketball", "air-jordan-1-retro-high",
            "skate", "vans-old-skool",
            "trail", "salomon-xt-6-gtx",
            "kids", "jordan-1-low-gs-kids",
            "training", "nike-metcon-9",
            "slip-on", "adidas-adilette-22-slip-on",
            "limited-edition", "air-jordan-4-retro-bred"
    );

    private static String categoryImageFromProduct(String categorySlug) {
        String productSlug = CATEGORY_HERO_PRODUCT.get(categorySlug);
        if (productSlug == null) {
            return unsplash("photo-1549298916-b41d501d3772", 800);
        }
        return catalogProducts().stream()
                .filter(p -> p.slug().equals(productSlug))
                .map(SeedProduct::imageUrl)
                .findFirst()
                .orElse(unsplash("photo-1549298916-b41d501d3772", 800));
    }

    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryService inventoryService;

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
            SeedStats stats = upsertCatalog();
            if (stats.isNoOp()) {
                log.info("Catalog seed up-to-date — {} product(s) already present", productRepository.count());
            } else {
                log.info(
                        "Catalog seed complete — created {} brand(s), {} category(ies), {} product(s), {} variant(s); refreshed {} product image(s), {} variant(s)",
                        stats.createdBrands(), stats.createdCategories(), stats.createdProducts(),
                        stats.createdVariants(), stats.updatedImages(), stats.updatedVariants());
            }
        } catch (DataAccessException e) {
            log.warn("Skip catalog seed because database is not ready: {}", e.getMessage());
        }
    }

    static List<String> seedProductSlugs() {
        return catalogProducts().stream().map(SeedProduct::slug).toList();
    }

    private SeedStats upsertCatalog() {
        LocalDateTime now = LocalDateTime.now();
        BrandSeedResult brandResult = seedBrands(now);
        CategorySeedResult categoryResult = seedCategories(now);

        int createdProducts = 0;
        int createdVariants = 0;
        int updatedImages = 0;
        int updatedVariants = 0;

        for (SeedProduct seed : catalogProducts()) {
            Brand brand = brandResult.brands().get(seed.brandSlug());
            List<String> categoryIds = seed.categorySlugs().stream()
                    .map(slug -> categoryResult.categories().get(slug))
                    .filter(c -> c != null && c.getCategoryId() != null)
                    .map(Category::getCategoryId)
                    .toList();

            Optional<Product> existingOpt = productRepository.findBySlug(seed.slug());
            Product product;
            if (existingOpt.isEmpty()) {
                product = productRepository.save(Product.builder()
                        .name(seed.name())
                        .slug(seed.slug())
                        .shortDescription(seed.shortDescription())
                        .description(seed.description())
                        .brandId(brand != null ? brand.getBrandId() : null)
                        .categoryIds(new ArrayList<>(categoryIds))
                        .genderTarget(seed.gender())
                        .material(seed.material())
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
                createdProducts++;
            } else {
                product = existingOpt.get();
                if (seedForce && !shouldPreserveImageUrl(firstImageUrl(product.getImageUrls()))) {
                    product.setImageUrls(List.of(seed.imageUrl()));
                    product.setUpdatedAt(now);
                    product = productRepository.save(product);
                    updatedImages++;
                }
            }

            if (product == null || product.getProductId() == null) {
                continue;
            }

            Map<String, ProductVariant> existingBySku = new LinkedHashMap<>();
            for (ProductVariant existingVariant : variantRepository.findByProductId(product.getProductId())) {
                if (existingVariant.getSku() != null) {
                    existingBySku.putIfAbsent(existingVariant.getSku(), existingVariant);
                }
            }

            String brandCode = seed.brandSlug().toUpperCase(Locale.ROOT).replace("-", "");
            for (SeedVariant color : seed.variants()) {
                for (int size = color.sizeFrom(); size <= color.sizeTo(); size++) {
                    String sku = "%s-%s-%d".formatted(brandCode, color.code(), size);
                    int initialStock = color.stockForSize(size);
                    ProductVariant existingVariant = existingBySku.get(sku);
                    if (existingVariant == null) {
                        ProductVariant variant = variantRepository.save(ProductVariant.builder()
                                .productId(product.getProductId())
                                .sku(sku)
                                .size(String.valueOf(size))
                                .colorName(color.colorName())
                                .colorHex(color.colorHex())
                                .price((double) seed.basePrice())
                                .compareAtPrice(seed.compareAtPrice())
                                .costPrice((double) Math.round(seed.basePrice() * 0.55))
                                .weight(0.85)
                                .imageUrls(List.of(seed.imageUrl()))
                                .status(VariantStatus.ACTIVE)
                                .createdAt(now)
                                .updatedAt(now)
                                .build());
                        if (variant != null) {
                            existingBySku.put(sku, variant);
                            if (variant.getVariantId() != null) {
                                inventoryService.ensureInventory(variant.getVariantId(), initialStock);
                            }
                        }
                        createdVariants++;
                    } else {
                        if (existingVariant.getVariantId() != null) {
                            inventoryService.ensureInventory(existingVariant.getVariantId(), initialStock);
                        }
                        if (seedForce) {
                            if (!shouldPreserveImageUrl(firstImageUrl(existingVariant.getImageUrls()))) {
                                existingVariant.setImageUrls(List.of(seed.imageUrl()));
                            }
                            existingVariant.setPrice((double) seed.basePrice());
                            existingVariant.setCompareAtPrice(seed.compareAtPrice());
                            existingVariant.setCostPrice((double) Math.round(seed.basePrice() * 0.55));
                            existingVariant.setUpdatedAt(now);
                            variantRepository.save(existingVariant);
                            updatedVariants++;
                        }
                    }
                }
            }
        }

        return new SeedStats(
                brandResult.createdCount(),
                categoryResult.createdCount(),
                createdProducts,
                createdVariants,
                updatedImages,
                updatedVariants
        );
    }

    /** Keep Cloudinary / custom CDN URLs — never downgrade to Unsplash on refresh. */
    private static boolean shouldPreserveImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        if (url.contains("res.cloudinary.com")) {
            return true;
        }
        return !url.contains("images.unsplash.com");
    }

    private static String firstImageUrl(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        return imageUrls.get(0);
    }

    private BrandSeedResult seedBrands(LocalDateTime now) {
        List<String[]> data = List.of(
                new String[]{"Nike", "nike", "Thương hiệu thể thao hàng đầu thế giới."},
                new String[]{"Adidas", "adidas", "Ba sọc — biểu tượng performance và streetwear."},
                new String[]{"New Balance", "new-balance", "Made in USA heritage, comfort-first."},
                new String[]{"Jordan", "jordan", "Dòng giày bóng rổ huyền thoại của Michael Jordan."},
                new String[]{"Converse", "converse", "Chuck Taylor — sneaker văn hóa đại chúng."},
                new String[]{"Vans", "vans", "Skate culture và lifestyle California."},
                new String[]{"ASICS", "asics", "Chạy bộ Nhật Bản, công nghệ GEL."},
                new String[]{"Puma", "puma", "Thể thao và street style từ Đức."},
                new String[]{"Salomon", "salomon", "Giày chạy trail & Gorpcore kỹ thuật cao từ Pháp."},
                new String[]{"HOKA", "hoka", "Đệm tối đa (Max Cushion) cho chạy đường dài và phục hồi."},
                new String[]{"Reebok", "reebok", "Di sản fitness, Classic Leather và Club C vượt thời gian."}
        );
        Map<String, Brand> brands = new LinkedHashMap<>();
        int created = 0;
        for (String[] row : data) {
            Optional<Brand> existing = brandRepository.findBySlug(row[1]);
            if (existing.isPresent()) {
                brands.put(row[1], existing.get());
            } else {
                Brand saved = brandRepository.save(Brand.builder()
                        .name(row[0])
                        .slug(row[1])
                        .description(row[2])
                        .active(true)
                        .createdAt(now)
                        .updatedAt(now)
                        .build());
                brands.put(row[1], saved);
                created++;
            }
        }
        return new BrandSeedResult(brands, created);
    }

    private CategorySeedResult seedCategories(LocalDateTime now) {
        List<String[]> data = List.of(
                new String[]{"Running", "running", "Giày chạy bộ, đệm êm, hỗ trợ tốc độ.",
                        categoryImageFromProduct("running")},
                new String[]{"Lifestyle", "lifestyle", "Sneaker phong cách hàng ngày, dễ phối đồ.",
                        categoryImageFromProduct("lifestyle")},
                new String[]{"Basketball", "basketball", "High-top và performance court shoes.",
                        categoryImageFromProduct("basketball")},
                new String[]{"Skate", "skate", "Đế bền, grip tốt cho skate và street.",
                        categoryImageFromProduct("skate")},
                new String[]{"Trail", "trail", "Chạy địa hình, grip và chống nước.",
                        categoryImageFromProduct("trail")},
                new String[]{"Kids", "kids", "Size nhỏ cho trẻ em và thanh thiếu niên.",
                        categoryImageFromProduct("kids")},
                new String[]{"Training", "training", "Giày tập gym, HIIT và cross-training ổn định.",
                        categoryImageFromProduct("training")},
                new String[]{"Slip-On", "slip-on", "Giày lười, mule và slide tiện lợi mang hằng ngày.",
                        categoryImageFromProduct("slip-on")},
                new String[]{"Limited Edition", "limited-edition", "Phiên bản giới hạn, collab và retro sưu tầm.",
                        categoryImageFromProduct("limited-edition")}
        );
        Map<String, Category> categories = new LinkedHashMap<>();
        int created = 0;
        for (String[] row : data) {
            Optional<Category> existingOpt = categoryRepository.findBySlug(row[1]);
            if (existingOpt.isPresent()) {
                Category existing = existingOpt.get();
                boolean needsImagePopulate = existing.getImageUrl() == null || existing.getImageUrl().isBlank();
                boolean needsImageRefresh = seedForce && !shouldPreserveImageUrl(existing.getImageUrl());
                if (needsImagePopulate || needsImageRefresh) {
                    existing.setImageUrl(row[3]);
                    existing.setUpdatedAt(now);
                    existing = categoryRepository.save(existing);
                }
                categories.put(row[1], existing);
            } else {
                Category saved = categoryRepository.save(Category.builder()
                        .name(row[0])
                        .slug(row[1])
                        .description(row[2])
                        .imageUrl(row[3])
                        .active(true)
                        .createdAt(now)
                        .updatedAt(now)
                        .build());
                categories.put(row[1], saved);
                created++;
            }
        }
        return new CategorySeedResult(categories, created);
    }

    static List<SeedProduct> catalogProducts() {
        return List.of(
                // --- Existing 12 products (preserve slugs & existing SKU prefixes) ---
                product("Nike Air Max 90", "nike-air-max-90",
                        "Lifestyle sneaker kinh điển với đế Air visible.", "Đế Air, upper da + mesh, phong cách retro.",
                        "nike", List.of("lifestyle"), GenderTarget.UNISEX,
                        "Da tổng hợp / Mesh / Đế Air",
                        unsplash("photo-1542291026-7eec264c27ff", 900),
                        290, 340.0, List.of(
                                variant("WHT", "Trắng", "#F5F5F5", 40, 42),
                                variant("BLK", "Đen", "#111111", 40, 43))),
                product("Adidas Ultraboost 22", "adidas-ultraboost-22",
                        "Giày chạy bộ premium với đệm Boost siêu êm.", "Boost midsole, Primeknit upper, hỗ trợ chạy đường dài.",
                        "adidas", List.of("running"), GenderTarget.MEN,
                        "Primeknit / Đế Boost / Continental Rubber",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073364/ecommerce/products/l6fjll9mmq2vb1ofljoa.webp",
                        420, 480.0, List.of(
                                variant("BLK", "Core Black", "#1A1A1A", 40, 43),
                                variant("WHT", "Cloud White", "#EFEFEF", 41, 44))),
                product("New Balance 550", "new-balance-550",
                        "Basketball-inspired lifestyle với tỷ lệ vintage hoàn hảo.", "Leather upper, logo N cổ điển, dễ phối đồ.",
                        "new-balance", List.of("lifestyle", "basketball"), GenderTarget.UNISEX,
                        "Da thật / Đế cao su cupsole",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073544/ecommerce/products/ylqdvyfhcwjpilfjvdmd.webp",
                        270, 310.0, List.of(
                                variant("GRN", "Green", "#2F5D3A", 39, 42),
                                variant("WHT", "White", "#F8F8F8", 40, 43))),
                product("Air Jordan 1 Retro High", "air-jordan-1-retro-high",
                        "Huyền thoại bóng rổ với silhouette High OG.", "High-top leather, Wings logo, biểu tượng streetwear.",
                        "jordan", List.of("basketball", "limited-edition"), GenderTarget.MEN,
                        "Da full-grain / Đế Air-Sole",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073595/ecommerce/products/cxjaeaueajj4nnnlhz3m.webp",
                        490, 560.0, List.of(
                                variant("RED", "Chicago", "#C62D42", 40, 43),
                                variant("BLK", "Black Toe", "#111111", 41, 44))),
                product("Converse Chuck 70 High", "converse-chuck-70-high",
                        "Phiên bản cao cấp của Chuck Taylor cổ điển.", "Canvas dày hơn, đế OrthoLite, form high-top.",
                        "converse", List.of("lifestyle", "skate"), GenderTarget.UNISEX,
                        "Canvas 12oz / Đệm OrthoLite / Cao su lưu hóa",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073630/ecommerce/products/vuydcwilydktiiymnjyx.webp",
                        190, 220.0, List.of(
                                variant("BLK", "Đen", "#111111", 38, 42),
                                variant("WHT", "Trắng", "#FFFFFF", 39, 43))),
                product("Vans Old Skool", "vans-old-skool",
                        "Biểu tượng skate với sọc Jazz Stripe.", "Suede/canvas, waffle outsole, phong cách street.",
                        "vans", List.of("skate", "lifestyle"), GenderTarget.UNISEX,
                        "Da lộn / Canvas / Đế Waffle",
                        unsplash("photo-1549298916-b41d501d3772", 900),
                        180, 210.0, List.of(
                                variant("BLK", "Black/White", "#111111", 38, 42),
                                variant("NVY", "Navy", "#1E3A5F", 39, 43))),
                product("Nike Dunk Low", "nike-dunk-low",
                        "Dunk Low phối màu Panda — bestseller toàn cầu.", "Leather two-tone, đế cupsole, dễ mix-match.",
                        "nike", List.of("lifestyle"), GenderTarget.UNISEX,
                        "Da tổng hợp cao cấp / Đế cao su",
                        unsplash("photo-1595950653106-6c9ebd614d3a", 900),
                        330, 380.0, List.of(
                                variant("PND", "Panda", "#F5F5F5", 40, 43),
                                variant("GRY", "Grey Fog", "#B0B0B0", 41, 44))),
                product("Adidas Samba OG", "adidas-samba-og",
                        "Samba OG — sneaker bóng đá chuyển sang lifestyle.", "Suede T-toe, gum sole, form slim.",
                        "adidas", List.of("lifestyle"), GenderTarget.UNISEX,
                        "Da thật / Mũi da lộn / Gum sole",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073666/ecommerce/products/hwm8yd0t6kr3535oprhd.webp",
                        250, 290.0, List.of(
                                variant("WHT", "White/Black", "#F8F8F8", 39, 42),
                                variant("GRN", "Collegiate Green", "#1F4D3A", 40, 43))),
                product("ASICS Gel-Kayano 14", "asics-gel-kayano-14",
                        "Retro runner Y2K với hệ thống GEL đệm êm.", "Mesh layered upper, đế GEL, vibe archive.",
                        "asics", List.of("running", "lifestyle"), GenderTarget.UNISEX,
                        "Mesh thoáng khí / Công nghệ GEL",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073704/ecommerce/products/lgov2lv9bdzlpfbr5ze7.webp",
                        360, 410.0, List.of(
                                variant("SLV", "Silver", "#C0C0C0", 40, 43),
                                variant("WHT", "Cream", "#F2E8D8", 41, 44))),
                product("Puma Suede Classic", "puma-suede-classic",
                        "Suede Classic — icon hip-hop từ thập niên 70.", "Suede upper, Formstrip, đế rubber.",
                        "puma", List.of("lifestyle"), GenderTarget.UNISEX,
                        "Da lộn / Đế cao su",
                        unsplash("photo-1460353581641-37baddab0fa2", 900),
                        160, 190.0, List.of(
                                variant("RED", "Team Regal Red", "#B91C1C", 39, 42),
                                variant("BLK", "Black", "#111111", 40, 43))),
                product("Nike Air Force 1 '07", "nike-air-force-1-07",
                        "AF1 '07 — nền tảng của sneaker culture hiện đại.", "Full-grain leather, đế Air, form low.",
                        "nike", List.of("lifestyle", "basketball"), GenderTarget.UNISEX,
                        "Da full-grain / Đế Air",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073841/ecommerce/products/eimqyyf2dgryeiol7dlh.webp",
                        280, 320.0, List.of(
                                variant("WHT", "Triple White", "#FFFFFF", 40, 43),
                                variant("BLK", "Triple Black", "#111111", 41, 44))),
                product("New Balance 2002R", "new-balance-2002r",
                        "2002R với đế N-ERGY + ABZORB — comfort tối đa.", "Mesh/suede mix, logo N lớn, phong cách dad shoe.",
                        "new-balance", List.of("running", "lifestyle"), GenderTarget.UNISEX,
                        "Da lộn / Mesh / Đệm N-ERGY + ABZORB",
                        "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073890/ecommerce/products/hhs9banvlpeieujyynqs.png",
                        320, 360.0, List.of(
                                variant("GRY", "Rain Cloud", "#A8A8A8", 40, 43),
                                variant("NVY", "Protection Pack Navy", "#1E2A44", 41, 44))),

                // --- 16 new diverse products (brands, categories, genders, prices, sizes 36-45, low-stock <= 3) ---
                product("Salomon XT-6 GTX", "salomon-xt-6-gtx",
                        "Giày trail Gorpcore chống nước GORE-TEX.", "Màng GORE-TEX chống thấm, đế Contagrip bám địa hình đá ướt, Quicklace.",
                        "salomon", List.of("trail", "limited-edition"), GenderTarget.UNISEX,
                        "TPU Mesh / GORE-TEX / Đế Contagrip",
                        unsplash("photo-1606107557195-0e29a4b5b4aa", 900),
                        550, 620.0, List.of(
                                variant("XT6B", "Black/Ebony", "#141414", 39, 44, Map.of(44, 2)),
                                variant("XT6S", "Lunar Rock", "#C4C2BA", 40, 43))),
                product("Salomon Speedcross 6", "salomon-speedcross-6",
                        "Chuyên chạy trail bùn đất với gai đế sâu 5mm.", "Trọng lượng nhẹ, SensiFit ôm chân chắc chắn trên địa hình dốc.",
                        "salomon", List.of("trail", "running"), GenderTarget.MEN,
                        "Ripstop Mesh / Mud Contagrip",
                        unsplash("photo-1551107696-a4b0c5a0d9a2", 900),
                        390, 440.0, List.of(
                                variant("SC6G", "Olive Moss", "#4A5D3F", 40, 45),
                                variant("SC6O", "Blazing Orange", "#E05A2B", 41, 44))),
                product("HOKA Clifton 9 Women", "hoka-clifton-9",
                        "Giày chạy đường trường siêu nhẹ, đệm EVA êm ái.", "Form Meta-Rocker mượt mà giúp chuyển bước tự nhiên, giảm chấn khớp gối.",
                        "hoka", List.of("running"), GenderTarget.WOMEN,
                        "Engineered Knit / Đế CMEVA",
                        unsplash("photo-1579338559199-fd52370f5f0b", 900),
                        370, 420.0, List.of(
                                variant("CL9P", "Rose Quartz", "#E6B8B8", 36, 40),
                                variant("CL9W", "Cloud White", "#F4F4F2", 37, 40))),
                product("HOKA Bondi 8", "hoka-bondi-8",
                        "Đệm Max Cushion dày nhất của HOKA cho phục hồi và đi bộ dài.", "Extended heel crash pad, upper thoáng khí cho runner cự ly dài.",
                        "hoka", List.of("running", "training"), GenderTarget.MEN,
                        "Mesh kỹ thuật / Đế EVA siêu dày",
                        unsplash("photo-1605348532760-6753d2c43329", 900),
                        430, null, List.of(
                                variant("BN8B", "Sharkskin", "#495057", 40, 45),
                                variant("BN8N", "Coastal Sky", "#3B6E8C", 40, 44))),
                product("Reebok Club C 85 Vintage", "reebok-club-c-85-vintage",
                        "Sneaker tennis thập niên 80 với da mềm và tông kem cổ điển.", "Dễ phối với quần âu, denim hay váy thể thao nhờ dáng gọn thanh lịch.",
                        "reebok", List.of("lifestyle"), GenderTarget.UNISEX,
                        "Da bò mềm / Đệm EVA cổ điển",
                        unsplash("photo-1608231387042-66d1773070a5", 900),
                        220, 260.0, List.of(
                                variant("CC85C", "Chalk/Green", "#EDEAE0", 37, 43),
                                variant("CC85N", "Chalk/Navy", "#23395D", 38, 42))),
                product("Reebok Nano X4", "reebok-nano-x4",
                        "Giày cross-training ổn định cho nâng tạ, squat và HIIT.", "Công nghệ Lift and Run Chassis giữ gót vững khi tạ nặng, linh hoạt khi chạy.",
                        "reebok", List.of("training"), GenderTarget.MEN,
                        "Flexweave Knit / Đế Lift & Run",
                        unsplash("photo-1584735935682-2f2b69dff9d2", 900),
                        330, 370.0, List.of(
                                variant("NX4B", "Core Black", "#18181B", 40, 44),
                                variant("NX4R", "Crimson", "#B91C1C", 41, 44))),
                product("Nike Metcon 9 Women", "nike-metcon-9",
                        "Chuẩn mực giày tập gym & CrossFit với tấm Hyperlift rộng.", "Bảo vệ cổ chân, bám dây leo tốt và thoáng khí khi tập cường độ cao.",
                        "nike", List.of("training"), GenderTarget.WOMEN,
                        "Mesh gia cường / Hyperlift Heel Plate",
                        unsplash("photo-1515955656352-a1fa3ffcd111", 900),
                        350, 400.0, List.of(
                                variant("MC9L", "Lilac Ice", "#C8B6E2", 36, 40),
                                variant("MC9B", "Anthracite", "#262626", 36, 39))),
                product("Nike Pegasus 41", "nike-pegasus-41",
                        "Đôi giày chạy bộ đa năng với 2 túi Air Zoom và bọt ReactX.", "Hoàn trả năng lượng cao hơn 13%, phù hợp chạy hằng ngày lẫn tempo.",
                        "nike", List.of("running"), GenderTarget.MEN,
                        "Engineered Mesh / ReactX + Dual Air Zoom",
                        unsplash("photo-1600185365926-3a2ce3cdb9eb", 900),
                        340, 380.0, List.of(
                                variant("PG41V", "Volt Green", "#84CC16", 40, 45),
                                variant("PG41B", "Obsidian", "#1E293B", 40, 44))),
                product("Air Jordan 4 Retro Bred Reimagined", "air-jordan-4-retro-bred",
                        "Phiên bản da lộn nâng cấp sang da full-grain cao cấp của huyền thoại Bred.", "Chi tiết Jumpman gót sau, đệm Air lộ thiên, bản sưu tầm giới hạn.",
                        "jordan", List.of("basketball", "limited-edition"), GenderTarget.MEN,
                        "Da full-grain / Đế Air-Sole",
                        unsplash("photo-1587563871167-1ee9c731aefb", 900),
                        790, 890.0, List.of(
                                variant("AJ4BR", "Bred", "#991B1B", 40, 45, Map.of(45, 2)),
                                variant("AJ4MB", "Military Blue", "#1D4ED8", 41, 44))),
                product("Jordan 1 Low GS Kids", "jordan-1-low-gs-kids",
                        "Air Jordan 1 cổ thấp thiết kế riêng cho thiếu niên và chân nhỏ.", "Đệm nhẹ êm chân, cổ giày thấp linh hoạt cho đi học và chơi thể thao.",
                        "jordan", List.of("kids", "basketball"), GenderTarget.KIDS,
                        "Da tổng hợp / Đế cao su mềm",
                        unsplash("photo-1560769629-975ec94e6a86", 900),
                        230, 260.0, List.of(
                                variant("AJ1KR", "Gym Red", "#DC2626", 36, 39),
                                variant("AJ1KB", "Royal Blue", "#2563EB", 36, 38))),
                product("Adidas Gazelle Indoor Women", "adidas-gazelle-indoor",
                        "Gazelle Indoor đế gum trong suốt — xu hướng Terrace nổi bật.", "Da lộn mềm mịn phối sọc răng cưa tương phản, nhẹ và ôm chân nữ.",
                        "adidas", List.of("lifestyle"), GenderTarget.WOMEN,
                        "Da lộn cao cấp / Gum rubber translucent",
                        unsplash("photo-1525966222134-fcfa99b8ae77", 900),
                        260, 300.0, List.of(
                                variant("GZIB", "Bliss Pink", "#F4A5AE", 36, 40),
                                variant("GZIG", "Collegiate Green", "#15803D", 37, 40))),
                product("Adidas Adilette 22 Slip-On", "adidas-adilette-22-slip-on",
                        "Dép đúc 3D lấy cảm hứng địa hình sao Hỏa, nhẹ và chống nước.", "Chất liệu EVA sinh học từ mía đường, êm ái mang trong nhà lẫn đi biển.",
                        "adidas", List.of("slip-on", "lifestyle"), GenderTarget.UNISEX,
                        "Bio-EVA đúc nguyên khối",
                        unsplash("photo-1539185441755-769473a23570", 900),
                        120, 150.0, List.of(
                                variant("AD22S", "Desert Sand", "#D6C7B2", 37, 44),
                                variant("AD22B", "Carbon", "#1F2937", 38, 43))),
                product("Vans Classic Slip-On Checkerboard", "vans-classic-slip-on-checkerboard",
                        "Slip-On họa tiết bàn cờ bất hủ — xỏ vào là đi ngay.", "Cổ giày lót đệm êm, thun co giãn hai bên và đế Waffle bám ván cực tốt.",
                        "vans", List.of("slip-on", "skate"), GenderTarget.UNISEX,
                        "Canvas dày / Đế Waffle cao su",
                        unsplash("photo-1549298916-b41d501d3772", 900),
                        150, 180.0, List.of(
                                variant("VSOC", "Checkerboard", "#111111", 36, 43),
                                variant("VSOW", "True White", "#F9FAFB", 37, 42))),
                product("New Balance 990v6 Made in USA", "new-balance-990v6",
                        "Đỉnh cao dòng 990 với bọt FuelCell kết hợp ENCAP êm mượt cả ngày.", "Gia công tại Mỹ, chất liệu da lộn heo và lưới thoáng cao cấp.",
                        "new-balance", List.of("running", "limited-edition"), GenderTarget.UNISEX,
                        "Pigskin Suede / Mesh / FuelCell + ENCAP",
                        unsplash("photo-1539185441755-769473a23570", 900),
                        650, 720.0, List.of(
                                variant("990G", "Castlerock Grey", "#8D9196", 39, 44, Map.of(39, 3)),
                                variant("990N", "Navy", "#1E3A5F", 40, 44))),
                product("Puma RS-X Kids", "puma-rs-x-kids",
                        "Sneaker chunky năng động cho bé với đệm Running System êm ái.", "Màu sắc tươi sáng, đế bám chống trượt an toàn cho các hoạt động hằng ngày.",
                        "puma", List.of("kids", "lifestyle"), GenderTarget.KIDS,
                        "Mesh / Da tổng hợp / Đệm RS",
                        unsplash("photo-1560769629-975ec94e6a86", 900),
                        140, 170.0, List.of(
                                variant("RSXK", "Sky/Lime", "#38BDF8", 36, 39),
                                variant("RSXP", "Coral/White", "#FB7185", 36, 38))),
                product("Converse Run Star Hike", "converse-run-star-hike",
                        "Chuck Taylor đế platform răng cưa cá tính, tăng chiều cao 4cm.", "Phối màu tối giản nhưng nổi bật với đế cao su hai tông màu.",
                        "converse", List.of("lifestyle", "limited-edition"), GenderTarget.WOMEN,
                        "Canvas hữu cơ / Đệm OrthoLite / Đế răng cưa",
                        unsplash("photo-1584735935682-2f2b69dff9d2", 900),
                        240, 280.0, List.of(
                                variant("RSHB", "Black/Gum", "#18181B", 36, 40),
                                variant("RSHW", "Parchment", "#F5F0E6", 36, 39)))
        );
    }

    private static SeedProduct product(
            String name,
            String slug,
            String shortDescription,
            String description,
            String brandSlug,
            List<String> categorySlugs,
            GenderTarget gender,
            String material,
            String imageUrl,
            int basePrice,
            Double compareAtPrice,
            List<SeedVariant> variants) {
        return new SeedProduct(name, slug, shortDescription, description,
                brandSlug, categorySlugs, gender, material, imageUrl, basePrice, compareAtPrice, variants);
    }

    private static SeedVariant variant(String code, String colorName, String colorHex, int sizeFrom, int sizeTo) {
        return new SeedVariant(code, colorName, colorHex, sizeFrom, sizeTo, Map.of());
    }

    private static SeedVariant variant(
            String code,
            String colorName,
            String colorHex,
            int sizeFrom,
            int sizeTo,
            Map<Integer, Integer> stockOverrides) {
        return new SeedVariant(code, colorName, colorHex, sizeFrom, sizeTo, stockOverrides);
    }

    record SeedProduct(
            String name,
            String slug,
            String shortDescription,
            String description,
            String brandSlug,
            List<String> categorySlugs,
            GenderTarget gender,
            String material,
            String imageUrl,
            int basePrice,
            Double compareAtPrice,
            List<SeedVariant> variants) {
    }

    record SeedVariant(
            String code,
            String colorName,
            String colorHex,
            int sizeFrom,
            int sizeTo,
            Map<Integer, Integer> stockOverrides) {
        int stockForSize(int size) {
            return stockOverrides.getOrDefault(size, 15 + size);
        }
    }

    private record BrandSeedResult(Map<String, Brand> brands, int createdCount) {
    }

    private record CategorySeedResult(Map<String, Category> categories, int createdCount) {
    }

    private record SeedStats(
            int createdBrands,
            int createdCategories,
            int createdProducts,
            int createdVariants,
            int updatedImages,
            int updatedVariants) {
        boolean isNoOp() {
            return createdBrands == 0 && createdCategories == 0 && createdProducts == 0
                    && createdVariants == 0 && updatedImages == 0 && updatedVariants == 0;
        }
    }
}
