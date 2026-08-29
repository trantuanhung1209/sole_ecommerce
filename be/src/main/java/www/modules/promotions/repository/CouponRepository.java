package www.modules.promotions.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.promotions.model.Coupon;

import java.util.Optional;

public interface CouponRepository extends MongoRepository<Coupon, String> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
}
