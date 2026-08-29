package www.service.implement;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import www.config.JwtProperties;
import www.model.dto.response.SessionResponse;
import www.model.entity.Session;
import www.service.interfaces.JwtService;
import www.service.interfaces.SessionService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionServiceImpl implements SessionService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private static final String SESSION_PREFIX = "refresh:";
    private static final String ACCESS_PREFIX = "access:";
    private static final int REFRESH_TOKEN_EXPIRATION_DAYS = 7;

    @Override
    public String createSession(String userId, String userAgent, String ip) {
        String sessionId = UUID.randomUUID().toString();
        String refreshToken = jwtService.generateRefreshToken(userId, sessionId);
        
        Session session = Session.builder()
                .sessionId(sessionId)
                .userId(userId)
                .refreshToken(refreshToken)
                .userAgent(userAgent)
                .ip(ip)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRATION_DAYS))
                .build();

        String key = SESSION_PREFIX + userId + ":" + sessionId;
        redisTemplate.opsForValue().set(key, session, REFRESH_TOKEN_EXPIRATION_DAYS, TimeUnit.DAYS);
        
        log.info("Created session {} for user {}", sessionId, userId);
        return sessionId;
    }

    @Override
    public Optional<Session> getSession(String userId, String sessionId) {
        String key = SESSION_PREFIX + userId + ":" + sessionId;
        Object sessionData = redisTemplate.opsForValue().get(key);
        
        if (sessionData == null) {
            return Optional.empty();
        }
        
        try {
            // Convert LinkedHashMap to Session
            Session session = objectMapper.convertValue(sessionData, Session.class);
            return Optional.of(session);
        } catch (Exception e) {
            log.error("Error converting session data for user {} session {}", userId, sessionId, e);
            return Optional.empty();
        }
    }

    @Override
    public boolean validateRefreshToken(String refreshToken) {
        try {
            // First validate the JWT structure and signature
            if (!jwtService.validateRefreshToken(refreshToken)) {
                log.warn("Invalid JWT refresh token structure");
                return false;
            }

            // Extract userId and sessionId from token
            String userId = jwtService.getUserIdFromToken(refreshToken);
            String sessionId = jwtService.getSessionIdFromRefreshToken(refreshToken);

            // Check if session exists in Redis
            Optional<Session> sessionOpt = getSession(userId, sessionId);
            
            if (sessionOpt.isEmpty()) {
                log.warn("Session not found: {} for user {}", sessionId, userId);
                return false;
            }

            Session session = sessionOpt.get();
            
            // Check if session has expired
            if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
                log.warn("Session expired: {} for user {}", sessionId, userId);
                deleteSession(userId, sessionId);
                return false;
            }

            // Compare the stored refresh token with the provided one
            boolean isValid = session.getRefreshToken().equals(refreshToken);
            if (!isValid) {
                log.warn("Refresh token mismatch for session: {} user: {}", sessionId, userId);
            }

            return isValid;
        } catch (Exception e) {
            log.error("Error validating refresh token", e);
            return false;
        }
    }

    @Override
    public void deleteSession(String userId, String sessionId) {
        String key = sessionKey(userId, sessionId);
        redisTemplate.delete(key);
        redisTemplate.delete(accessKey(userId, sessionId));
        log.info("Deleted session {} for user {}", sessionId, userId);
    }

    @Override
    public void bindAccessToken(String userId, String sessionId, String accessToken) {
        Optional<Session> sessionOpt = getSession(userId, sessionId);
        if (sessionOpt.isEmpty()) {
            log.warn("Cannot bind access token — session not found: {} for user {}", sessionId, userId);
            return;
        }

        Session session = sessionOpt.get();
        session.setAccessToken(accessToken);
        redisTemplate.opsForValue().set(
                sessionKey(userId, sessionId),
                session,
                REFRESH_TOKEN_EXPIRATION_DAYS,
                TimeUnit.DAYS);

        long accessTtlMs = jwtProperties.getAccessToken().getExpiration();
        redisTemplate.opsForValue().set(
                accessKey(userId, sessionId),
                accessToken,
                accessTtlMs,
                TimeUnit.MILLISECONDS);

        log.debug("Bound access token to session {} for user {}", sessionId, userId);
    }

    @Override
    public boolean validateAccessToken(String accessToken) {
        try {
            if (!jwtService.validateToken(accessToken)) {
                return false;
            }

            String userId = jwtService.getUserIdFromToken(accessToken);
            String sessionId = jwtService.getSessionIdFromAccessToken(accessToken);

            Object storedAccess = redisTemplate.opsForValue().get(accessKey(userId, sessionId));
            if (storedAccess == null) {
                log.warn("Access token not found in Redis for session {} user {}", sessionId, userId);
                return false;
            }

            if (!accessToken.equals(storedAccess.toString())) {
                log.warn("Access token mismatch for session {} user {}", sessionId, userId);
                return false;
            }

            Optional<Session> sessionOpt = getSession(userId, sessionId);
            if (sessionOpt.isEmpty()) {
                return false;
            }

            Session session = sessionOpt.get();
            if (session.getAccessToken() == null || !session.getAccessToken().equals(accessToken)) {
                return false;
            }

            if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
                deleteSession(userId, sessionId);
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Error validating access token", e);
            return false;
        }
    }

    private String sessionKey(String userId, String sessionId) {
        return SESSION_PREFIX + userId + ":" + sessionId;
    }

    private String accessKey(String userId, String sessionId) {
        return ACCESS_PREFIX + userId + ":" + sessionId;
    }

    @Override
    public void deleteAllUserSessions(String userId) {
        String sessionPattern = SESSION_PREFIX + userId + ":*";
        var sessionKeys = redisTemplate.keys(sessionPattern);
        if (sessionKeys != null && !sessionKeys.isEmpty()) {
            redisTemplate.delete(sessionKeys);
        }
        String accessPattern = ACCESS_PREFIX + userId + ":*";
        var accessKeys = redisTemplate.keys(accessPattern);
        if (accessKeys != null && !accessKeys.isEmpty()) {
            redisTemplate.delete(accessKeys);
        }
        log.info("Deleted all sessions for user {}", userId);
    }

    @Override
    public String getRefreshToken(String userId, String sessionId) {
        Optional<Session> sessionOpt = getSession(userId, sessionId);
        return sessionOpt.map(Session::getRefreshToken).orElse(null);
    }

    @Override
    public List<SessionResponse> listSessions(String userId, String currentSessionId) {
        String pattern = SESSION_PREFIX + userId + ":*";
        var keys = redisTemplate.keys(pattern);
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }
        List<SessionResponse> sessions = new ArrayList<>();
        for (String key : keys) {
            Object sessionData = redisTemplate.opsForValue().get(key);
            if (sessionData == null) continue;
            try {
                Session session = objectMapper.convertValue(sessionData, Session.class);
                sessions.add(SessionResponse.builder()
                        .sessionId(session.getSessionId())
                        .userAgent(session.getUserAgent())
                        .ip(session.getIp())
                        .createdAt(session.getCreatedAt())
                        .expiresAt(session.getExpiresAt())
                        .current(session.getSessionId().equals(currentSessionId))
                        .build());
            } catch (Exception e) {
                log.warn("Skip invalid session key {}", key);
            }
        }
        sessions.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return sessions;
    }
}