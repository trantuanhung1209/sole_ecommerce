package www.exception;

public class TokenBlacklistedException extends JwtAuthenticationException {
    public TokenBlacklistedException(String message) {
        super(message);
    }
}