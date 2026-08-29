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
import www.modules.orders.repository.OrderRepository;
import www.modules.reviews.dto.ProductReviewDtos.*;
import www.modules.reviews.model.ProductReview;
import www.modules.reviews.repository.ProductReviewRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProductReviewService {
    private final ProductReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public Page<ProductReview> productReviews(String productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndVisibleTrueOrderByCreatedAtDesc(productId, pageable);
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
        return reviewRepository.save(ProductReview.builder()
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

    public ProductReview vote(String reviewId) {
        ProductReview review = get(reviewId);
        review.setHelpfulCount((review.getHelpfulCount() != null ? review.getHelpfulCount() : 0) + 1);
        review.setUpdatedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    private ProductReview get(String reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
    }
}
