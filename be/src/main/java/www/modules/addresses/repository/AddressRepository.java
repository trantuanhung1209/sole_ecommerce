package www.modules.addresses.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import www.modules.addresses.model.Address;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends MongoRepository<Address, String> {
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(String userId);
    Optional<Address> findByAddressIdAndUserId(String addressId, String userId);
    List<Address> findByUserIdAndIsDefaultTrue(String userId);
}
