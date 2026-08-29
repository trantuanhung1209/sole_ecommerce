package www.modules.promotions.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.promotions.model.CouponUsage;

import java.util.List;

public interface CouponUsageRepository extends MongoRepository<CouponUsage, String> {
    long countByCouponIdAndUserId(String couponId, String userId);
    List<CouponUsage> findByCouponId(String couponId);
}
