package www.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import www.model.entity.User;
import www.model.enums.UserRole;
import www.repository.UserRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSeedServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private UserSeedService service;

    @BeforeEach
    void setUp() {
        service = new UserSeedService(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(service, "seedEnabled", true);
        ReflectionTestUtils.setField(service, "seedPassword", "Sole@123");
    }

    @Test
    void skipsWhenDisabled() {
        ReflectionTestUtils.setField(service, "seedEnabled", false);
        service.seedUsersIfMissing();
        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    void seedsAllRolesAndInactiveUserIdempotently() {
        when(passwordEncoder.encode("Sole@123")).thenReturn("hashed");
        Set<String> existingEmails = new HashSet<>(Set.of("customer@sole.test", "admin@sole.test"));
        when(userRepository.existsByEmail(anyString())).thenAnswer(inv -> existingEmails.contains(inv.getArgument(0)));
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            existingEmails.add(u.getEmail());
            return u;
        });

        service.seedUsersIfMissing();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(8)).save(captor.capture());
        List<User> saved = captor.getAllValues();

        Set<UserRole> roles = saved.stream().map(User::getRole).collect(Collectors.toSet());
        assertThat(roles).contains(
                UserRole.CUSTOMER, UserRole.STAFF, UserRole.SHOP_MANAGER, UserRole.SUPER_ADMIN);
        assertThat(saved)
                .filteredOn(u -> "locked@sole.test".equals(u.getEmail()))
                .singleElement()
                .satisfies(u -> {
                    assertThat(u.getIsActive()).isFalse();
                    assertThat(u.isEnabled()).isFalse();
                });

        clearInvocations(userRepository);
        service.seedUsersIfMissing();
        verify(userRepository, never()).save(any());
    }
}
