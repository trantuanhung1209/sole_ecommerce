package www.modules.inventory;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import com.mongodb.client.result.UpdateResult;
import www.modules.catalog.repository.ProductRepository;
import www.modules.catalog.repository.ProductVariantRepository;
import www.modules.common.EcommerceEnums.ReservationStatus;
import www.modules.inventory.model.StockReservation;
import www.modules.inventory.repository.InventoryRepository;
import www.modules.inventory.repository.StockReservationRepository;
import www.modules.inventory.service.InventoryService;
import www.modules.search.service.SearchIndexService;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private StockReservationRepository reservationRepository;
    @Mock
    private ProductVariantRepository variantRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private MongoTemplate mongoTemplate;
    @Mock
    private SearchIndexService searchIndexService;

    @InjectMocks
    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(
                inventoryRepository,
                reservationRepository,
                variantRepository,
                productRepository,
                mongoTemplate,
                searchIndexService);
    }

    @Test
    void expireReservations_releasesStock() {
        StockReservation reservation = StockReservation.builder()
                .reservationId("r1")
                .orderId("o1")
                .variantId("v1")
                .quantity(2)
                .status(ReservationStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();

        when(reservationRepository.findByStatusAndExpiresAtBefore(eq(ReservationStatus.ACTIVE), any()))
                .thenReturn(List.of(reservation));
        UpdateResult updateResult = mock(UpdateResult.class);
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(www.modules.inventory.model.Inventory.class)))
                .thenReturn(updateResult);
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        int count = inventoryService.expireReservations();

        assertEquals(1, count);
        ArgumentCaptor<StockReservation> saved = ArgumentCaptor.forClass(StockReservation.class);
        verify(reservationRepository).save(saved.capture());
        assertEquals(ReservationStatus.EXPIRED, saved.getValue().getStatus());
        verify(mongoTemplate).updateFirst(any(Query.class), any(Update.class), eq(www.modules.inventory.model.Inventory.class));
    }
}
