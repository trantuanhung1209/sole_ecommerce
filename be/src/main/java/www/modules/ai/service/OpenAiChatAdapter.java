package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
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

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/responses",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
        );
        Object outputText = response.getBody() != null ? response.getBody().get("output_text") : null;
        if (outputText != null) {
            return outputText.toString();
        }
        return "I could not generate an answer right now.";
    }
}
