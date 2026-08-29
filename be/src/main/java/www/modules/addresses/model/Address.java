package www.modules.addresses.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "addresses")
public class Address {
    @Id
    private String addressId;
    private String userId;
    private String recipientName;
    private String phone;
    private String line1;
    private String line2;
    private String ward;
    private String district;
    private String city;
    @Builder.Default
    private Boolean isDefault = false;
    @Field("created_at")
    private LocalDateTime createdAt;
    @Field("updated_at")
    private LocalDateTime updatedAt;
}
