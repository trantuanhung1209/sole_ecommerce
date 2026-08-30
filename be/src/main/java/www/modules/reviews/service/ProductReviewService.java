package www.modules.reviews.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.exception.ForbiddenException;
import www.exception.NotFoundException;
import www.modules.common.EcommerceEnums.OrderStatus;
import www.modules.orders.model.Order;
import www.modules.orders.model.OrderItem;
import www.modules.catalog.repository.ProductRepository;
import www.modules.orders.repository.OrderRepository;
import www.modules.reviews.dto.ProductReviewDtos.*;
import www.modules.reviews.model.ProductReview;
import www.modules.reviews.repository.ProductReviewRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import www.modules.catalog.model.Product;

@Service
@RequiredArgsConstructor
public class ProductReviewService {
    private final ProductReviewRepository reviewRepository;
    private final ProductReviewQueryService reviewQueryService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public Page<ProductReview> productReviews(String productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndVisibleTrueOrderByCreatedAtDesc(productId, pageable);
    }

    public Page<PublicReviewView> browsePublic(
            Integer rating,
            String productId,
            String search,
            String sort,
            Pageable pageable) {
        var filter = new ProductReviewQueryService.ReviewBrowseFilter(true, null, rating, productId, search, sort);
        return mapPublicViews(reviewQueryService.findReviews(filter, pageable));
    }

    public Page<PublicReviewView> browseAdmin(
            Integer rating,
            String productId,
            String search,
            Boolean visible,
            String sort,
            Pageable pageable) {
        var filter = new ProductReviewQueryService.ReviewBrowseFilter(false, visible, rating, productId, search, sort);
        return mapPublicViews(reviewQueryService.findReviews(filter, pageable));
    }

    private Page<PublicReviewView> mapPublicViews(Page<ProductReview> page) {
        Set<String> productIds = page.getContent().stream()
                .map(ProductReview::getProductId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());
        Map<String, Product> products = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getProductId, product -> product));

        List<PublicReviewView> views = page.getContent().stream()
                .map(review -> toPublicReviewView(review, products.get(review.getProductId())))
                .toList();
        return new org.springframework.data.domain.PageImpl<>(views, page.getPageable(), page.getTotalElements());
    }

    private PublicReviewView toPublicReviewView(ProductReview review, Product product) {
        return PublicReviewView.builder()
                .reviewId(review.getReviewId())
                .productId(review.getProductId())
                .productName(product != null ? product.getName() : null)
                .productSlug(product != null ? product.getSlug() : null)
                .userId(review.getUserId())
                .rating(review.getRating())
                .title(review.getTitle())
                .content(review.getContent())
                .imageUrls(review.getImageUrls())
                .helpfulCount(review.getHelpfulCount())
                .verifiedPurchase(review.getVerifiedPurchase())
                .visible(review.getVisible())
                .staffReply(review.getStaffReply())
                .createdAt(review.getCreatedAt())
                .build();
    }

    public Page<ProductReview> myReviews(String userId, Pageable pageable) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public HomeReviewsResponse homeReviews(int limit) {
        int size = Math.max(1, Math.min(limit, 12));
        List<ProductReview> visible = reviewRepository.findByVisibleTrue();
        double averageRating = visible.stream()
                .mapToInt(review -> review.getRating() != null ? review.getRating() : 0)
                .average()
                .orElse(0);

        List<HomeReviewView> recent = reviewRepository
                .findByVisibleTrueOrderByCreatedAtDesc(Pageable.ofSize(size))
                .stream()
                .map(this::toHomeReviewView)
                .toList();

        return HomeReviewsResponse.builder()
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .totalReviews(visible.size())
                .recent(recent)
                .build();
    }

    private HomeReviewView toHomeReviewView(ProductReview review) {
        String productName = null;
        String productSlug = null;
        if (review.getProductId() != null) {
            var product = productRepository.findById(review.getProductId()).orElse(null);
            if (product != null) {
                productName = product.getName();
                productSlug = product.getSlug();
            }
        }
        return HomeReviewView.builder()
                .reviewId(review.getReviewId())
                .productId(review.getProductId())
                .productName(productName)
                .productSlug(productSlug)
                .userId(review.getUserId())
                .rating(review.getRating())
                .title(review.getTitle())
                .content(review.getContent())
                .verifiedPurchase(review.getVerifiedPurchase())
                .createdAt(review.getCreatedAt())
                .build();
    }

    public ProductReview create(String userId, CreateReviewRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + request.getOrderId()));
        if (!userId.equals(order.getUserId())) {
            throw new BadRequestException("Cannot review another customer's order");
        }
        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Only delivered orders can be reviewed");
        }
        if (reviewRepository.findByUserIdAndOrderIdAndOrderItemId(userId, order.getOrderId(), request.getOrderItemId()).isPresent()) {
            throw new BadRequestException("Order item has already been reviewed");
        }
        OrderItem item = order.getItems().stream()
                .filter(orderItem -> request.getOrderItemId().equals(orderItem.getOrderItemId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Order item not found: " + request.getOrderItemId()));
        LocalDateTime now = LocalDateTime.now();
        item.setReviewed(true);
        order.setUpdatedAt(now);
        orderRepository.save(order);
        ProductReview saved = reviewRepository.save(ProductReview.builder()
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .userId(userId)
                .orderId(order.getOrderId())
                .orderItemId(item.getOrderItemId())
                .rating(request.getRating())
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrls(request.getImageUrls())
                .createdAt(now)
                .updatedAt(now)
                .build());
        return saved;
    }

    public ProductReview reply(String reviewId, ReplyReviewRequest request, String actorId) {
        ProductReview review = get(reviewId);
        review.setStaffReply(request.getReply());
        review.setRepliedBy(actorId);
        review.setRepliedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    public ProductReview setVisibility(String reviewId, VisibilityRequest request) {
        ProductReview review = get(reviewId);
        review.setVisible(request.getVisible());
        review.setUpdatedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    public ProductReview update(String userId, String reviewId, UpdateReviewRequest request) {
        ProductReview review = get(reviewId);
        if (!userId.equals(review.getUserId())) {
            throw new ForbiddenException("Cannot update another user's review");
        }
        if (request.getRating() != null) review.setRating(request.getRating());
        if (request.getTitle() != null) review.setTitle(request.getTitle());
        if (request.getContent() != null) review.setContent(request.getContent());
        if (request.getImageUrls() != null) review.setImageUrls(request.getImageUrls());
        review.setUpdatedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    public void delete(String userId, String reviewId) {
        ProductReview review = get(reviewId);
        if (!userId.equals(review.getUserId())) {
            throw new ForbiddenException("Cannot delete another user's review");
        }
        reviewRepository.delete(review);
    }

    public ProductReview vote(String reviewId, String userId) {
        ProductReview review = get(reviewId);
        if (review.getVotedUserIds() == null) {
            review.setVotedUserIds(new ArrayList<>());
        }
        if (review.getVotedUserIds().contains(userId)) {
            return review;
        }
        review.getVotedUserIds().add(userId);
        review.setHelpfulCount((review.getHelpfulCount() != null ? review.getHelpfulCount() : 0) + 1);
        review.setUpdatedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    private ProductReview get(String reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
    }
}
