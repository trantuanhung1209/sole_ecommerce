package www.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;
import www.model.entity.User;
import www.modules.catalog.model.Product;
import www.modules.catalog.repository.ProductRepository;
import www.modules.reviews.model.ProductReview;
import www.modules.reviews.repository.ProductReviewRepository;
import www.modules.search.service.SearchIndexService;
import www.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@DependsOn({"catalogSeedService", "userSeedService"})
@RequiredArgsConstructor
@Slf4j
public class ReviewSeedService {

    private static final String SEED_ORDER_PREFIX = "seed-order-";

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SearchIndexService searchIndexService;

    @Value("${review.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${review.seed.force:false}")
    private boolean seedForce;

    @PostConstruct
    public void seedReviewsIfEmpty() {
        if (!seedEnabled) {
            log.info("Review seed disabled");
            return;
        }
        try {
            if (productRepository.count() == 0) {
                log.info("Review seed skipped — catalog not ready");
                return;
            }
            if (reviewRepository.count() > 0) {
                if (seedForce) {
                    int removed = clearSeedReviews();
                    log.info("Review seed force — removed {} existing seed review(s)", removed);
                } else {
                    log.info("Review seed skipped — {} review(s) already exist", reviewRepository.count());
                    return;
                }
            }
            int created = seedReviews();
            log.info("Review seed complete — {} demo review(s) ready for Home & product pages", created);
        } catch (DataAccessException e) {
            log.warn("Skip review seed because database is not ready: {}", e.getMessage());
        }
    }

    private int clearSeedReviews() {
        List<ProductReview> seedReviews = reviewRepository.findByOrderIdStartingWith(SEED_ORDER_PREFIX);
        if (seedReviews.isEmpty()) {
            return 0;
        }
        reviewRepository.deleteAll(seedReviews);
        return seedReviews.size();
    }

    private int seedReviews() {
        Optional<User> customer = userRepository.findByEmail("customer@sole.test");
        Optional<User> customer2 = userRepository.findByEmail("customer2@sole.test");
        if (customer.isEmpty() && customer2.isEmpty()) {
            log.warn("Review seed skipped — no demo customer accounts found");
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        Set<String> productIds = new LinkedHashSet<>();
        List<ProductReview> batch = new ArrayList<>();
        int index = 1;

        for (SeedReviewDef def : reviewDefinitions()) {
            Optional<Product> product = productRepository.findBySlug(def.productSlug());
            if (product.isEmpty()) {
                log.debug("Review seed skip — product slug not found: {}", def.productSlug());
                continue;
            }
            User user = def.useSecondCustomer() ? customer2.orElse(customer.orElse(null)) : customer.orElse(customer2.orElse(null));
            if (user == null) {
                continue;
            }

            String orderId = SEED_ORDER_PREFIX + String.format("%03d", index);
            String orderItemId = "seed-item-" + String.format("%03d", index);
            LocalDateTime createdAt = now.minusDays(def.daysAgo()).minusHours(index);

            batch.add(ProductReview.builder()
                    .productId(product.get().getProductId())
                    .userId(user.getUserId())
                    .orderId(orderId)
                    .orderItemId(orderItemId)
                    .rating(def.rating())
                    .title(def.title())
                    .content(def.content())
                    .visible(true)
                    .verifiedPurchase(true)
                    .helpfulCount(def.helpfulCount())
                    .createdAt(createdAt)
                    .updatedAt(createdAt)
                    .build());
            productIds.add(product.get().getProductId());
            index++;
        }

        if (batch.isEmpty()) {
            log.warn("Review seed skipped — no matching products for demo reviews");
            return 0;
        }

        reviewRepository.saveAll(batch);
        productIds.forEach(searchIndexService::indexProductAsync);
        return batch.size();
    }

    private static List<SeedReviewDef> reviewDefinitions() {
        return List.of(
                review("nike-air-force-1-07", false, 5, "Đúng size, form chuẩn",
                        "AF1 Triple White đẹp, giao nhanh, đúng size. Da mịn, đế sạch, đi rất êm.", 2, 12),
                review("nike-dunk-low", true, 5, "Panda chính hãng",
                        "Dunk Panda chính hãng, checkout SePay tiện. Màu trắng đen dễ phối mọi outfit.", 1, 18),
                review("adidas-ultraboost-22", false, 5, "Đệm Boost siêu êm",
                        "Chạy 10km không mỏi chân. Primeknit ôm chân vừa vặn, nên lấy đúng size thường đi.", 3, 9),
                review("air-jordan-1-retro-high", true, 4, "Đẹp nhưng cần break-in",
                        "Jordan 1 Chicago form đẹp, leather cứng hơn AF1 một chút. Sau vài ngày đi thì cực kỳ thoải mái.", 4, 7),
                review("converse-chuck-70-high", false, 5, "Chuck 70 cao cấp",
                        "UI gọn, chọn màu/size rõ ràng, rất thích. Canvas dày hơn bản thường, đế êm hơn hẳn.", 2, 6),
                review("new-balance-550", true, 5, "Vintage đúng nghĩa",
                        "550 xanh lá phối đồ cực dễ. Logo N nổi bật, da sạch không lỗi, giao trong 3 ngày.", 5, 11),
                review("vans-old-skool", false, 4, "Skate classic",
                        "Old Skool form hơi rộng nửa size, nên thử trước nếu chân bé. Chất lượng ổn, sọc Jazz đẹp.", 6, 4),
                review("adidas-samba-og", true, 5, "Samba hot trend",
                        "Samba OG trắng đen dễ phối quần jeans. Đế gum bám tốt, da suede mềm.", 3, 14),
                review("asics-gel-kayano-14", false, 5, "Y2K runner đỉnh",
                        "Kayano 14 silver nhìn ngoài đời đẹp hơn ảnh. GEL đệm êm, vibe archive rất chất.", 7, 8),
                review("puma-suede-classic", true, 4, "Giá tốt, form slim",
                        "Suede Classic đỏ đô nổi bật. Giá mềm so với Nike/Adidas, phù hợp đi học đi chơi.", 8, 3),
                review("nike-air-max-90", false, 5, "Retro Air Max",
                        "Air Max 90 đỏ trắng classic. Đế Air visible, đi cả ngày không đau gót.", 4, 10),
                review("new-balance-2002r", true, 5, "Dad shoe comfort",
                        "2002R Rain Cloud xám nhạt dễ phối. N-ERGY + ABZORB êm thật, support phản hồi nhanh.", 1, 15),
                review("nike-air-force-1-07", true, 4, "Support phản hồi nhanh",
                        "Support phản hồi nhanh, đổi size dễ dàng. Lần đầu hơi chật, đổi lên nửa size là vừa.", 9, 5),
                review("nike-dunk-low", false, 5, "Grey Fog dễ phối",
                        "Grey Fog tone xám nhẹ, sạch sẽ. Da mềm, form true-to-size với mình.", 10, 6),
                review("adidas-ultraboost-22", true, 4, "Chạy bộ ổn định",
                        "Boost ổn định khi chạy tempo. Upper hơi ấm vào mùa hè nhưng không đáng kể.", 11, 2),
                review("air-jordan-1-retro-high", false, 5, "Black Toe đẹp",
                        "Black Toe leather đẹp, màu phối cân đối. Hộp nguyên seal, tag đầy đủ.", 12, 4)
        );
    }

    private static SeedReviewDef review(
            String productSlug,
            boolean useSecondCustomer,
            int rating,
            String title,
            String content,
            int daysAgo,
            int helpfulCount) {
        return new SeedReviewDef(productSlug, useSecondCustomer, rating, title, content, daysAgo, helpfulCount);
    }

    private record SeedReviewDef(
            String productSlug,
            boolean useSecondCustomer,
            int rating,
            String title,
            String content,
            int daysAgo,
            int helpfulCount) {
    }
}
