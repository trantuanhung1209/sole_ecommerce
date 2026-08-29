package www.service.interfaces;

import www.model.dto.response.SessionResponse;
import www.model.entity.Session;

import java.util.List;
import java.util.Optional;

public interface SessionService {
    String createSession(String userId, String userAgent, String ip);
    Optional<Session> getSession(String userId, String sessionId);
    boolean validateRefreshToken(String refreshToken);
    void deleteSession(String userId, String sessionId);

    void deleteAllUserSessions(String userId);

    String getRefreshToken(String userId, String sessionId);

    void bindAccessToken(String userId, String sessionId, String accessToken);

    boolean validateAccessToken(String accessToken);

    List<SessionResponse> listSessions(String userId, String currentSessionId);
}