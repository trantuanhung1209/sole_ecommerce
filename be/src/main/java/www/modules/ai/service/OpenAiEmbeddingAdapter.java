package www.modules.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAiEmbeddingAdapter {
    private static final Duration CACHE_TTL = Duration.ofDays(7);

    private final RestTemplate restTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.embedding-model:text-embedding-3-small}")
    private String embeddingModel;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @SuppressWarnings("unchecked")
    public List<Double> embed(String text) {
        if (!isConfigured()) {
            return List.of();
        }
        if (text == null || text.isBlank()) {
            return List.of();
        }

        String cacheKey = "ai:emb:" + sha256(text);
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                return objectMapper.readValue(cached, new TypeReference<>() {});
            }
        } catch (Exception ex) {
            log.debug("Embedding cache read failed: {}", ex.getMessage());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", text
        );

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.openai.com/v1/embeddings",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            List<Double> embedding = extractEmbedding(response.getBody());
            if (!embedding.isEmpty()) {
                try {
                    redisTemplate.opsForValue().set(
                            cacheKey,
                            objectMapper.writeValueAsString(embedding),
                            CACHE_TTL
                    );
                } catch (Exception ex) {
                    log.debug("Embedding cache write failed: {}", ex.getMessage());
                }
            }
            return embedding;
        } catch (RestClientResponseException ex) {
            log.error("OpenAI embedding error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("OpenAI embedding request failed", ex);
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Double> extractEmbedding(Map<String, Object> body) {
        if (body == null) {
            return List.of();
        }
        Object data = body.get("data");
        if (!(data instanceof List<?> rows) || rows.isEmpty()) {
            return List.of();
        }
        Object first = rows.get(0);
        if (!(first instanceof Map<?, ?> row)) {
            return List.of();
        }
        Object embedding = row.get("embedding");
        if (!(embedding instanceof List<?> values)) {
            return List.of();
        }
        return values.stream().map(v -> ((Number) v).doubleValue()).toList();
    }

    private static String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            return Integer.toHexString(text.hashCode());
        }
    }
}
