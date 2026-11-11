package www.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private FilterChain filterChain;

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter(redisTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(filter, "enabled", true);
        ReflectionTestUtils.setField(filter, "windowMinutes", 15L);
        ReflectionTestUtils.setField(filter, "loginMax", 5);
        ReflectionTestUtils.setField(filter, "otpMax", 10);
        ReflectionTestUtils.setField(filter, "checkoutMax", 10);
        ReflectionTestUtils.setField(filter, "aiChatMax", 30);
        ReflectionTestUtils.setField(filter, "aiVoiceMax", 10);
        ReflectionTestUtils.setField(filter, "aiImageMax", 10);
    }

    @Test
    void allowsRequestWithinLimitAndSetsExpiryOnFirstHit() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:/auth/login:192.0.2.10")).thenReturn(1L);

        MockHttpServletRequest request = postRequest("/api/auth/login", "192.0.2.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(redisTemplate).expire("rate:/auth/login:192.0.2.10", Duration.ofMinutes(15));
        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void returns429WhenLimitExceeded() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:/auth/login:192.0.2.10")).thenReturn(6L);

        MockHttpServletRequest request = postRequest("/api/auth/login", "192.0.2.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain, never()).doFilter(any(), any());
        verify(redisTemplate, never()).expire(anyString(), any(Duration.class));
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getContentAsString()).contains("Too many requests. Please try again later.");
    }

    @Test
    void failsOpenWhenRedisIncrementThrows() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString()))
                .thenThrow(new RedisConnectionFailureException("Redis down"));

        MockHttpServletRequest request = postRequest("/api/checkout", "192.0.2.20");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void failsOpenWhenRedisExpireThrows() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:/ai/chat:192.0.2.30")).thenReturn(1L);
        doThrow(new RedisConnectionFailureException("Redis timeout"))
                .when(redisTemplate).expire(anyString(), any(Duration.class));

        MockHttpServletRequest request = postRequest("/api/ai/chat", "192.0.2.30");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void keysByFirstXForwardedForIpAndFallsBackToRemoteAddrWhenBlank() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(2L);

        MockHttpServletRequest forwarded = postRequest("/api/auth/login", "10.0.0.5");
        forwarded.addHeader("X-Forwarded-For", " 203.0.113.42 , 10.0.0.1, 10.0.0.2 ");
        filter.doFilter(forwarded, new MockHttpServletResponse(), filterChain);

        verify(valueOperations).increment("rate:/auth/login:203.0.113.42");

        MockHttpServletRequest blankForwarded = postRequest("/api/auth/login", "198.51.100.7");
        blankForwarded.addHeader("X-Forwarded-For", "   ");
        filter.doFilter(blankForwarded, new MockHttpServletResponse(), filterChain);

        verify(valueOperations).increment("rate:/auth/login:198.51.100.7");
    }

    private static MockHttpServletRequest postRequest(String uri, String remoteAddr) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setRemoteAddr(remoteAddr);
        return request;
    }
}
