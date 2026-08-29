package www.service.interfaces;

import www.model.enums.UserRole;

import java.util.Date;

public interface JwtService {
    String generateAccessToken(String userId, String email, UserRole role, String sessionId);
    String generateRefreshToken(String userId, String sessionId);
    String getUserIdFromToken(String token);
    String getSessionIdFromAccessToken(String token);
    String getSessionIdFromRefreshToken(String token);
    UserRole getRoleFromToken(String token);
    Date getExpirationFromToken(String token);
    boolean validateToken(String token);
    boolean validateRefreshToken(String token);
}