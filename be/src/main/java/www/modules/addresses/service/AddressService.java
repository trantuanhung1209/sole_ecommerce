package www.modules.addresses.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import www.exception.NotFoundException;
import www.modules.addresses.dto.AddressDtos.AddressRequest;
import www.modules.addresses.model.Address;
import www.modules.addresses.repository.AddressRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressService {
    private final AddressRepository addressRepository;

    public List<Address> list(String userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
    }

    public Address create(String userId, AddressRequest request) {
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefault(userId);
        }
        LocalDateTime now = LocalDateTime.now();
        return addressRepository.save(Address.builder()
                .addressId(UUID.randomUUID().toString())
                .userId(userId)
                .recipientName(request.getRecipientName())
                .phone(request.getPhone())
                .line1(request.getLine1())
                .line2(request.getLine2())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    public Address update(String userId, String addressId, AddressRequest request) {
        Address address = getOwned(userId, addressId);
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefault(userId);
        }
        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setWard(request.getWard());
        address.setDistrict(request.getDistrict());
        address.setCity(request.getCity());
        address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));
        address.setUpdatedAt(LocalDateTime.now());
        return addressRepository.save(address);
    }

    public void delete(String userId, String addressId) {
        Address address = getOwned(userId, addressId);
        addressRepository.delete(address);
    }

    @Transactional
    public Address setDefault(String userId, String addressId) {
        clearDefault(userId);
        Address address = getOwned(userId, addressId);
        address.setIsDefault(true);
        address.setUpdatedAt(LocalDateTime.now());
        return addressRepository.save(address);
    }

    public Address getOwned(String userId, String addressId) {
        return addressRepository.findByAddressIdAndUserId(addressId, userId)
                .orElseThrow(() -> new NotFoundException("Address not found"));
    }

    private void clearDefault(String userId) {
        addressRepository.findByUserIdAndIsDefaultTrue(userId).forEach(addr -> {
            addr.setIsDefault(false);
            addr.setUpdatedAt(LocalDateTime.now());
            addressRepository.save(addr);
        });
    }
}
