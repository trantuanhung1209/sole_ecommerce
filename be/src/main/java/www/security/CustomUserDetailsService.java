package www.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import www.model.entity.User;
import www.model.enums.UserRole;
import www.repository.UserRepository;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tiềm thấy người dùng với email: " + email));

        return UserPrincipal.create(user);
    }

    public UserDetails loadUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với id: " + id));

        return UserPrincipal.create(user);
    }

    @Getter
    public static class UserPrincipal implements UserDetails {
        private String id;
        private String email;
        private String fullName;
        private String password;
        private boolean enabled;
        private UserRole role;
        private Collection<? extends GrantedAuthority> authorities;

        public UserPrincipal(String id, String email, String fullName, String password, 
                             boolean enabled, UserRole role, 
                             Collection<? extends GrantedAuthority> authorities) {
            this.id = id;
            this.email = email;
            this.fullName = fullName;
            this.password = password;
            this.enabled = enabled;
            this.role = role;
            this.authorities = authorities;
        }

        public static UserPrincipal create(User user) {
            UserRole effectiveRole = user.getRole() != null ? user.getRole() : UserRole.CUSTOMER;
            Collection<GrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + effectiveRole.name())
            );

            return new UserPrincipal(
                    user.getUserId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getPassword(),
                    user.isEnabled(),
                    effectiveRole,
                    authorities
            );
        }

        @Override
        public String getUsername() {
            return email;
        }

        @Override
        public String getPassword() {
            return password;
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return authorities;
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        // Getter methods
        public String getId() {
            return id;
        }

        public String getEmail() {
            return email;
        }

        public String getFullName() {
            return fullName;
        }

        public UserRole getRole() {
            return role;
        }
    }
}