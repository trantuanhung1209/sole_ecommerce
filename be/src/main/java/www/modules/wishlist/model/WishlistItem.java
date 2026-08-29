package www.modules.wishlist.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "wishlists")
@CompoundIndex(name = "uniq_user_product_wishlist", def = "{'userId': 1, 'productId': 1}", unique = true)
public class WishlistItem {
    @Id
    private String wishlistItemId;
    @Indexed
    private String userId;
    @Indexed
    private String productId;
    private LocalDateTime createdAt;
}
