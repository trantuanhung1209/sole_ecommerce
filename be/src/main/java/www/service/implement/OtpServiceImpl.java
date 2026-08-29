package www.service.implement;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import www.model.entity.OtpCode;
import www.service.interfaces.OtpService;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private static final String OTP_PREFIX = "otp:";
    private static final int OTP_EXPIRATION_MINUTES = 2;

    @Override
    public String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    @Override
    public void saveOtp(String email, String otp) {
        String key = OTP_PREFIX + email;
        OtpCode otpCode = OtpCode.builder()
                .email(email)
                .code(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES))
                .build();

        redisTemplate.opsForValue().set(key, otpCode, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);
        log.info("Saved OTP for email: {}", email);
    }

    @Override
    public boolean validateOtp(String email, String otp) {
        String key = OTP_PREFIX + email;
        Object storedData = redisTemplate.opsForValue().get(key);

        if (storedData == null) {
            log.warn("OTP not found for email: {}", email);
            return false;
        }

        try {
            // Convert LinkedHashMap to OtpCode
            OtpCode storedOtp = objectMapper.convertValue(storedData, OtpCode.class);

            if (LocalDateTime.now().isAfter(storedOtp.getExpiresAt())) {
                log.warn("OTP expired for email: {}", email);
                deleteOtp(email);
                return false;
            }

            boolean isValid = storedOtp.getCode().equals(otp);
            if (isValid) {
                log.info("OTP validated successfully for email: {}", email);
                deleteOtp(email); // Delete OTP after successful validation
            } else {
                log.warn("Invalid OTP for email: {}", email);
            }

            return isValid;

        } catch (Exception e) {
            log.error("Error converting stored OTP data for email: {}", email, e);
            return false;
        }
    }

    @Override
    public void deleteOtp(String email) {
        String key = OTP_PREFIX + email;
        redisTemplate.delete(key);
        log.info("Deleted OTP for email: {}", email);
    }

    @Override
    public Optional<String> getEmailByOtp(String otp) {
        try {
            // Search all OTP keys to find the one with matching OTP code
            Set<String> keys = redisTemplate.keys(OTP_PREFIX + "*");
            if (keys != null) {
                for (String key : keys) {
                    Object storedData = redisTemplate.opsForValue().get(key);
                    if (storedData != null) {
                        try {
                            OtpCode storedOtp = objectMapper.convertValue(storedData, OtpCode.class);
                            
                            // Check if OTP matches and is not expired
                            if (storedOtp.getCode().equals(otp) && 
                                LocalDateTime.now().isBefore(storedOtp.getExpiresAt())) {
                                log.info("Found email for OTP: {}", storedOtp.getEmail());
                                return Optional.of(storedOtp.getEmail());
                            }
                        } catch (Exception e) {
                            log.warn("Error converting OTP data for key: {}", key, e);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error searching for OTP: {}", otp, e);
        }
        
        log.warn("No valid email found for OTP: {}", otp);
        return Optional.empty();
    }
}