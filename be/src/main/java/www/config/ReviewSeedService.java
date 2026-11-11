package www.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import www.model.entity.User;
import www.modules.catalog.model.Product;
import www.modules.catalog.repository.ProductRepository;
import www.modules.reviews.model.ProductReview;
import www.modules.reviews.repository.ProductReviewRepository;
import www.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
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
            if (seedForce && reviewRepository.count() > 0) {
                int removed = clearSeedReviews();
                log.info("Review seed force — removed {} existing seed review(s)", removed);
            }
            int created = seedReviews();
            if (created == 0) {
                log.info("Review seed up-to-date — {} review(s) already present", reviewRepository.count());
            } else {
                log.info("Review seed complete — {} new demo review(s) added", created);
            }
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
        Optional<User> c1 = userRepository.findByEmail("customer@sole.test");
        Optional<User> c2 = userRepository.findByEmail("customer2@sole.test");
        Optional<User> c3 = userRepository.findByEmail("customer3@sole.test");
        Optional<User> c4 = userRepository.findByEmail("customer4@sole.test");
        if (c1.isEmpty() && c2.isEmpty() && c3.isEmpty() && c4.isEmpty()) {
            log.warn("Review seed skipped — no demo customer accounts found");
            return 0;
        }

        User fallbackPrimary = c1.or(() -> c2).or(() -> c3).or(() -> c4).orElseThrow();
        User fallbackSecondary = c2.orElse(fallbackPrimary);
        List<User> customers = List.of(
                c1.orElse(fallbackPrimary),
                c2.orElse(fallbackSecondary),
                c3.orElse(fallbackPrimary),
                c4.orElse(fallbackSecondary)
        );

        String staffId = userRepository.findByEmail("staff@sole.test")
                .or(() -> userRepository.findByEmail("manager@sole.test"))
                .map(User::getUserId)
                .orElse("staff-seed");

        List<ProductReview> existing = reviewRepository.findAll();
        Set<String> existingNaturalKeys = new HashSet<>();
        Set<String> existingOrderKeys = new HashSet<>();
        for (ProductReview review : existing) {
            if (review.getProductId() != null && review.getUserId() != null) {
                existingNaturalKeys.add(naturalKey(
                        review.getProductId(), review.getUserId(), review.getTitle(), review.getContent()));
            }
            if (review.getUserId() != null && review.getOrderId() != null && review.getOrderItemId() != null) {
                existingOrderKeys.add(orderKey(review.getUserId(), review.getOrderId(), review.getOrderItemId()));
            }
        }

        Map<String, Product> productCache = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        List<ProductReview> batch = new ArrayList<>();

        List<SeedReviewDef> defs = reviewDefinitions();
        for (int i = 0; i < defs.size(); i++) {
            SeedReviewDef def = defs.get(i);
            int index = i + 1;

            Product product = productCache.computeIfAbsent(
                    def.productSlug(),
                    slug -> productRepository.findBySlug(slug).orElse(null));
            if (product == null || product.getProductId() == null) {
                log.debug("Review seed skip — product slug not found: {}", def.productSlug());
                continue;
            }

            User user = customers.get(def.customerSlot() % customers.size());
            if (user == null || user.getUserId() == null) {
                continue;
            }

            String natKey = naturalKey(product.getProductId(), user.getUserId(), def.title(), def.content());
            if (existingNaturalKeys.contains(natKey)) {
                continue;
            }

            String orderId = SEED_ORDER_PREFIX + String.format("%03d", index);
            String orderItemId = "seed-item-" + String.format("%03d", index);
            String ordKey = orderKey(user.getUserId(), orderId, orderItemId);
            if (existingOrderKeys.contains(ordKey)) {
                continue;
            }

            LocalDateTime createdAt = now.minusDays(def.daysAgo()).minusHours(index);
            LocalDateTime repliedAt = def.staffReply() != null ? createdAt.plusHours(6) : null;

            batch.add(ProductReview.builder()
                    .productId(product.getProductId())
                    .userId(user.getUserId())
                    .orderId(orderId)
                    .orderItemId(orderItemId)
                    .rating(def.rating())
                    .title(def.title())
                    .content(def.content())
                    .visible(true)
                    .verifiedPurchase(true)
                    .helpfulCount(def.helpfulCount())
                    .staffReply(def.staffReply())
                    .repliedBy(def.staffReply() != null ? staffId : null)
                    .repliedAt(repliedAt)
                    .createdAt(createdAt)
                    .updatedAt(repliedAt != null ? repliedAt : createdAt)
                    .build());

            existingNaturalKeys.add(natKey);
            existingOrderKeys.add(ordKey);
        }

        if (batch.isEmpty()) {
            return 0;
        }

        reviewRepository.saveAll(batch);
        return batch.size();
    }

    static String naturalKey(String productId, String userId, String title, String content) {
        String raw = (title == null ? "" : title.trim()) + "|" + (content == null ? "" : content.trim());
        return productId + "|" + userId + "|" + sha256Hex(raw);
    }

    private static String orderKey(String userId, String orderId, String orderItemId) {
        return userId + "|" + orderId + "|" + orderItemId;
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(input.hashCode());
        }
    }

    private static List<SeedReviewDef> reviewDefinitions() {
        return List.of(
                // --- Existing 16 reviews (preserve product, slot, title, content so existing DB records are matched) ---
                review("nike-air-force-1-07", 0, 5, "Đúng size, form chuẩn",
                        "AF1 Triple White đẹp, giao nhanh, đúng size. Da mịn, đế sạch, đi rất êm.", 2, 12,
                        "Cảm ơn bạn đã tin tưởng SOLE! Rất vui vì AF1 làm bạn hài lòng."),
                review("nike-dunk-low", 1, 5, "Panda chính hãng",
                        "Dunk Panda chính hãng, checkout SePay tiện. Màu trắng đen dễ phối mọi outfit.", 1, 18,
                        "Cảm ơn bạn đã chọn SOLE. Hẹn gặp bạn ở những đợt restock tiếp theo!"),
                review("adidas-ultraboost-22", 0, 5, "Đệm Boost siêu êm",
                        "Chạy 10km không mỏi chân. Primeknit ôm chân vừa vặn, nên lấy đúng size thường đi.", 3, 9, null),
                review("air-jordan-1-retro-high", 1, 4, "Đẹp nhưng cần break-in",
                        "Jordan 1 Chicago form đẹp, leather cứng hơn AF1 một chút. Sau vài ngày đi thì cực kỳ thoải mái.", 4, 7, null),
                review("converse-chuck-70-high", 0, 5, "Chuck 70 cao cấp",
                        "UI gọn, chọn màu/size rõ ràng, rất thích. Canvas dày hơn bản thường, đế êm hơn hẳn.", 2, 6, null),
                review("new-balance-550", 1, 5, "Vintage đúng nghĩa",
                        "550 xanh lá phối đồ cực dễ. Logo N nổi bật, da sạch không lỗi, giao trong 3 ngày.", 5, 11, null),
                review("vans-old-skool", 0, 4, "Skate classic",
                        "Old Skool form hơi rộng nửa size, nên thử trước nếu chân bé. Chất lượng ổn, sọc Jazz đẹp.", 6, 4, null),
                review("adidas-samba-og", 1, 5, "Samba hot trend",
                        "Samba OG trắng đen dễ phối quần jeans. Đế gum bám tốt, da suede mềm.", 3, 14,
                        "Cảm ơn bạn! Samba OG hiện là một trong những mẫu bán chạy nhất tại SOLE."),
                review("asics-gel-kayano-14", 0, 5, "Y2K runner đỉnh",
                        "Kayano 14 silver nhìn ngoài đời đẹp hơn ảnh. GEL đệm êm, vibe archive rất chất.", 7, 8, null),
                review("puma-suede-classic", 1, 4, "Giá tốt, form slim",
                        "Suede Classic đỏ đô nổi bật. Giá mềm so với Nike/Adidas, phù hợp đi học đi chơi.", 8, 3, null),
                review("nike-air-max-90", 0, 5, "Retro Air Max",
                        "Air Max 90 đỏ trắng classic. Đế Air visible, đi cả ngày không đau gót.", 4, 10, null),
                review("new-balance-2002r", 1, 5, "Dad shoe comfort",
                        "2002R Rain Cloud xám nhạt dễ phối. N-ERGY + ABZORB êm thật, support phản hồi nhanh.", 1, 15, null),
                review("nike-air-force-1-07", 1, 4, "Support phản hồi nhanh",
                        "Support phản hồi nhanh, đổi size dễ dàng. Lần đầu hơi chật, đổi lên nửa size là vừa.", 9, 5, null),
                review("nike-dunk-low", 0, 5, "Grey Fog dễ phối",
                        "Grey Fog tone xám nhẹ, sạch sẽ. Da mềm, form true-to-size với mình.", 10, 6, null),
                review("adidas-ultraboost-22", 1, 4, "Chạy bộ ổn định",
                        "Boost ổn định khi chạy tempo. Upper hơi ấm vào mùa hè nhưng không đáng kể.", 11, 2, null),
                review("air-jordan-1-retro-high", 0, 5, "Black Toe đẹp",
                        "Black Toe leather đẹp, màu phối cân đối. Hộp nguyên seal, tag đầy đủ.", 12, 4, null),

                // --- 12 new reviews across new products and 1★-5★ spectrum with staff replies ---
                review("salomon-xt-6-gtx", 2, 5, "Chống nước cực đỉnh khi đi mưa",
                        "Mang XT-6 GTX đi Đà Lạt trời mưa dầm mà vớ vẫn khô ráo. Hệ thống dây Quicklace rất tiện.", 2, 16,
                        "Rất vui khi XT-6 GTX đồng hành tốt cùng bạn trong chuyến đi Đà Lạt!"),
                review("hoka-clifton-9", 2, 5, "Nhẹ tênh, chạy 5km mỗi sáng rất thích",
                        "Size 37 vừa khít chân nữ. Đệm êm nhưng không bị lún quá, giảm đau ống đồng rõ rệt.", 3, 13, null),
                review("reebok-club-c-85-vintage", 3, 5, "Màu Chalk cực kỳ thanh lịch",
                        "Da mềm ngay từ lần đầu mang, không bị cấn gót. Rất đáng tiền trong tầm giá 2 triệu.", 5, 9, null),
                review("air-jordan-4-retro-bred", 0, 5, "Đáng từng đồng cho bản Reimagined",
                        "Da full-grain thay cho nubuck dễ vệ sinh hơn hẳn. Hộp đẹp, check legit chuẩn chỉnh.", 4, 21,
                        "Cảm ơn bạn đã săn thành công Jordan 4 Bred Reimagined tại SOLE!"),
                review("nike-pegasus-41", 3, 4, "Độ nảy tốt cho bài chạy interval",
                        "ReactX kết hợp 2 túi Air Zoom cho cảm giác bật tốt. Tuy nhiên cổ giày hơi ôm với chân mu cao.", 6, 6, null),
                review("nike-metcon-9", 2, 3, "Tập tạ vững nhưng đi bộ hơi cứng",
                        "Đứng squat và deadlift rất đầm chân, nhưng nếu dùng để chạy máy trên 2km thì đế hơi cứng.", 8, 5,
                        "Cảm ơn góp ý của bạn! Metcon 9 tối ưu cho nâng tạ & HIIT; nếu chạy bộ nhiều bạn có thể tham khảo thêm Pegasus 41 hoặc Clifton 9 nhé."),
                review("adidas-adilette-22-slip-on", 1, 3, "Nhẹ nhưng form hơi rộng bề ngang",
                        "Thiết kế 3D lạ mắt, đi biển ổn. Nếu chân thon nên lùi 1 size cho ôm chân hơn.", 7, 4, null),
                review("vans-classic-slip-on-checkerboard", 3, 2, "Vải cứng ở phần cổ chân lúc mới đi",
                        "Màu Checkerboard đẹp nhưng mấy ngày đầu đi bị cọ nhẹ ở gót, phải dán băng cá nhân.", 9, 3,
                        "Rất tiếc vì trải nghiệm ban đầu chưa thoải mái! Bạn có thể mang kèm vớ dày trong 2–3 lần đầu để canvas mềm dần hoặc liên hệ CSKH để được hỗ trợ đổi size nhé."),
                review("salomon-speedcross-6", 3, 2, "Hơi bí nếu đi đường nhựa hằng ngày",
                        "Gai đế bám đất bùn rất tốt khi leo núi, nhưng mang đi làm đường nhựa thì hơi ồn và nóng.", 11, 2,
                        "Cảm ơn bạn đã chia sẻ! Speedcross 6 chuyên dụng cho địa hình bùn đất; nếu đi phố bạn có thể tham khảo XT-6 hoặc NB 2002R."),
                review("puma-rs-x-kids", 2, 1, "Giao nhầm màu so với ảnh mình đặt",
                        "Mình đặt màu Sky/Lime nhưng nhận hộp lại là Coral/White. Rất mong shop kiểm tra kỹ khâu đóng gói.", 13, 7,
                        "SOLE thành thật xin lỗi về sự cố đóng nhầm màu! Bộ phận CSKH đã liên hệ đổi mới miễn phí và gửi kèm mã freeship cho bạn."),
                review("new-balance-990v6", 0, 5, "Made in USA hoàn thiện quá xuất sắc",
                        "Chất liệu da lộn và lưới rất tinh tế, đi bộ cả ngày du lịch không hề mỏi chân.", 1, 19,
                        "Cảm ơn bạn đã ủng hộ dòng Made in USA tại SOLE!"),
                review("converse-run-star-hike", 2, 4, "Hack dáng tốt, đế bám chắc",
                        "Tăng chiều cao rõ rệt mà không bị chênh vênh như giày cao gót. Hơi nặng nhẹ hơn Chuck 70 thường.", 5, 8, null)
        );
    }

    private static SeedReviewDef review(
            String productSlug,
            int customerSlot,
            int rating,
            String title,
            String content,
            int daysAgo,
            int helpfulCount,
            String staffReply) {
        return new SeedReviewDef(productSlug, customerSlot, rating, title, content, daysAgo, helpfulCount, staffReply);
    }

    private record SeedReviewDef(
            String productSlug,
            int customerSlot,
            int rating,
            String title,
            String content,
            int daysAgo,
            int helpfulCount,
            String staffReply) {
    }
}
