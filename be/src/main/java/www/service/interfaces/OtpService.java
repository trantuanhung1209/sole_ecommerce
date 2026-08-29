package www.service.interfaces;

import java.util.Optional;

public interface OtpService {
    String generateOtp();
    void saveOtp(String email, String otp);
    boolean validateOtp(String email, String otp);
    void deleteOtp(String email);
    Optional<String> getEmailByOtp(String otp);
}