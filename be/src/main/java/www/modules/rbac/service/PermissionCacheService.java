package www.modules.rbac.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionCacheService {

    private static final Duration TTL = Duration.ofHours(1);
    private static final String KEY_PREFIX = "rbac:role:";

    private final StringRedisTemplate redisTemplate;

    public List<String> getCached(String roleCode) {
        String raw = redisTemplate.opsForValue().get(KEY_PREFIX + roleCode);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return Arrays.stream(raw.split(","))
                .filter(s -> !s.isBlank())
                .toList();
    }

    public void put(String roleCode, List<String> permissions) {
        String value = permissions.stream().sorted().collect(Collectors.joining(","));
        redisTemplate.opsForValue().set(KEY_PREFIX + roleCode, value, TTL);
    }

    public void invalidate(String roleCode) {
        redisTemplate.delete(KEY_PREFIX + roleCode);
    }

    public void invalidateAll(Set<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return;
        }
        redisTemplate.delete(roleCodes.stream().map(code -> KEY_PREFIX + code).toList());
    }
}
