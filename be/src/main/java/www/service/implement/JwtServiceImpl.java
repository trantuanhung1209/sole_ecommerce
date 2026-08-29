package www.service.implement;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.model.enums.UserRole;
import www.security.JwtTokenProvider;
import www.service.interfaces.JwtService;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class JwtServiceImpl implements JwtService {
    
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public String generateAccessToken(String userId, String email, UserRole role, String sessionId) {
        return jwtTokenProvider.generateAccessToken(userId, email, role, sessionId);
    }

    @Override
    public String generateRefreshToken(String userId, String sessionId) {
        return jwtTokenProvider.generateRefreshToken(userId, sessionId);
    }

    @Override
    public String getUserIdFromToken(String token) {
        return jwtTokenProvider.getUserIdFromToken(token);
    }


    @Override
    public String getSessionIdFromAccessToken(String token) {
        return jwtTokenProvider.getSessionIdFromAccessToken(token);
    }

    @Override
    public String getSessionIdFromRefreshToken(String token) {
        return jwtTokenProvider.getSessionIdFromRefreshToken(token);
    }

    @Override
    public UserRole getRoleFromToken(String token) {
        return jwtTokenProvider.getRoleFromToken(token);
    }

    @Override
    public Date getExpirationFromToken(String token) {
        return jwtTokenProvider.getExpirationFromToken(token);
    }

    @Override
    public boolean validateToken(String token) {
        return jwtTokenProvider.validateToken(token);
    }

    @Override
    public boolean validateRefreshToken(String token) {
        return jwtTokenProvider.validateRefreshToken(token);
    }
}