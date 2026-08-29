package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import www.modules.ai.model.AiMessage;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.ArrayList;
import java.util.HashMap;
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
    @Value("${ai.conversation.history-turns:8}")
    private int historyTurns;

    @SuppressWarnings("unchecked")
    public String answer(
            AiRouteType routeType,
            String contextText,
            List<AiMessage> history,
            String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Trợ lý AI chưa được cấu hình. Vui lòng đặt OPENAI_API_KEY trên backend.";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("instructions", AiPromptTemplates.instructions(routeType, contextText));
        body.put("input", buildInput(history, userMessage));

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
        return "Mình chưa tạo được câu trả lời lúc này. Bạn thử lại sau vài giây nhé.";
    }

    private List<Map<String, String>> buildInput(List<AiMessage> history, String userMessage) {
        List<Map<String, String>> input = new ArrayList<>();
        if (history != null && !history.isEmpty()) {
            int start = Math.max(0, history.size() - historyTurns);
            for (AiMessage message : history.subList(start, history.size())) {
                if (message.getContent() == null || message.getContent().isBlank()) {
                    continue;
                }
                String role = "assistant".equalsIgnoreCase(message.getRole()) ? "assistant" : "user";
                input.add(Map.of("role", role, "content", message.getContent()));
            }
        }
        input.add(Map.of("role", "user", "content", userMessage));
        return input;
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
