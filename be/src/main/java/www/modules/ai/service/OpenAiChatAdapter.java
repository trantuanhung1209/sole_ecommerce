package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAiChatAdapter {
    private final RestTemplate restTemplate;

    @Value("${openai.api-key:}")
    private String apiKey;
    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    @SuppressWarnings("unchecked")
    public String answer(String userMessage, String context) {
        if (apiKey == null || apiKey.isBlank()) {
            return "AI assistant is not configured yet. Please set OPENAI_API_KEY on the backend.";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", model,
                "input", List.of(Map.of(
                        "role", "user",
                        "content", "You are a shoe e-commerce shopping assistant. Do not mutate orders, payments, or refunds. Context:\n"
                                + context + "\n\nCustomer question:\n" + userMessage
                ))
        );

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.openai.com/v1/responses",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            String outputText = extractOutputText(response.getBody());
            if (outputText != null && !outputText.isBlank()) {
                return outputText;
            }
            log.warn("OpenAI response did not contain assistant text: {}", response.getBody());
        } catch (RestClientResponseException ex) {
            log.error("OpenAI API error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("OpenAI request failed", ex);
        }
        return "I could not generate an answer right now.";
    }

    @SuppressWarnings("unchecked")
    private String extractOutputText(Map<String, Object> body) {
        if (body == null) {
            return null;
        }

        Object direct = body.get("output_text");
        if (direct != null && !direct.toString().isBlank()) {
            return direct.toString();
        }

        Object output = body.get("output");
        if (!(output instanceof List<?> items)) {
            return null;
        }

        StringBuilder text = new StringBuilder();
        for (Object item : items) {
            if (!(item instanceof Map<?, ?> itemMap) || !"message".equals(String.valueOf(itemMap.get("type")))) {
                continue;
            }
            Object content = itemMap.get("content");
            if (!(content instanceof List<?> blocks)) {
                continue;
            }
            for (Object block : blocks) {
                if (!(block instanceof Map<?, ?> blockMap) || !"output_text".equals(String.valueOf(blockMap.get("type")))) {
                    continue;
                }
                Object blockText = blockMap.get("text");
                if (blockText != null) {
                    text.append(blockText);
                }
            }
        }
        return text.isEmpty() ? null : text.toString();
    }
}
