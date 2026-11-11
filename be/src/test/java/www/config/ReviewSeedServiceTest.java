package www.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import www.model.entity.User;
import www.modules.catalog.model.Product;
import www.modules.catalog.repository.ProductRepository;
import www.modules.reviews.model.ProductReview;
import www.modules.reviews.repository.ProductReviewRepository;
import www.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewSeedServiceTest {

    @Mock private ProductReviewRepository reviewRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserRepository userRepository;

    private ReviewSeedService service;

    @BeforeEach
    void setUp() {
        service = new ReviewSeedService(reviewRepository, productRepository, userRepository);
        ReflectionTestUtils.setField(service, "seedEnabled", true);
        ReflectionTestUtils.setField(service, "seedForce", false);
    }

    @Test
    void skipsWhenDisabled() {
        ReflectionTestUtils.setField(service, "seedEnabled", false);
        service.seedReviewsIfEmpty();
        verifyNoInteractions(reviewRepository, productRepository, userRepository);
    }

    @Test
    void seedsReviewsAcrossOneToFiveStarsAndIdempotentlySkipsDuplicates() {
        when(productRepository.count()).thenReturn(28L);
        when(userRepository.findByEmail("customer@sole.test"))
                .thenReturn(Optional.of(User.builder().userId("c1").build()));
        when(userRepository.findByEmail("customer2@sole.test"))
                .thenReturn(Optional.of(User.builder().userId("c2").build()));
        when(userRepository.findByEmail("customer3@sole.test"))
                .thenReturn(Optional.of(User.builder().userId("c3").build()));
        when(userRepository.findByEmail("customer4@sole.test"))
                .thenReturn(Optional.of(User.builder().userId("c4").build()));
        when(userRepository.findByEmail("staff@sole.test"))
                .thenReturn(Optional.of(User.builder().userId("s1").build()));

        when(productRepository.findBySlug(anyString())).thenAnswer(inv ->
                Optional.of(Product.builder().productId("prod-" + inv.getArgument(0)).slug(inv.getArgument(0)).build()));

        List<ProductReview> store = new ArrayList<>();
        when(reviewRepository.findAll()).thenAnswer(inv -> new ArrayList<>(store));
        when(reviewRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<ProductReview> batch = inv.getArgument(0);
            store.addAll(batch);
            return batch;
        });

        service.seedReviewsIfEmpty();

        assertThat(store).hasSizeGreaterThanOrEqualTo(24);
        Set<Integer> ratings = store.stream().map(ProductReview::getRating).collect(Collectors.toSet());
        assertThat(ratings).containsExactlyInAnyOrder(1, 2, 3, 4, 5);
        assertThat(store.stream().filter(r -> r.getStaffReply() != null).count()).isGreaterThanOrEqualTo(6);

        clearInvocations(reviewRepository);
        service.seedReviewsIfEmpty();
        verify(reviewRepository, never()).saveAll(anyList());
    }
}
