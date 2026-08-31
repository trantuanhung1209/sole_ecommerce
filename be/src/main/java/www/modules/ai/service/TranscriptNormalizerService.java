package www.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import www.modules.ai.dto.NormalizedTranscript;
import www.modules.ai.dto.TranscriptCorrection;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranscriptNormalizerService {

    private static final String SYSTEM_PROMPT = """
            Bạn là bộ chuẩn hóa transcript giọng nói cho website bán giày thể thao SOLE.
            Nhiệm vụ: sửa các từ bị nghe nhầm do lỗi nhận dạng giọng nói (ASR),
            đặc biệt là thuật ngữ giày dép/thể thao (ví dụ: "bóng rục" -> "bóng rổ").

            QUY TẮC BẮT BUỘC:
            - Chỉ sửa lỗi nghe nhầm/chính tả RÕ RÀNG. Không thêm ý mới, không diễn giải lại câu.
            - Không chắc chắn thì GIỮ NGUYÊN từ gốc, tuyệt đối không đoán bừa.
            - Giữ nguyên văn phong và độ dài câu gốc.
            """;

    private static final double MAX_CORRECTION_RATIO = 0.4;

    private final WebClient openAiWebClient;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    public NormalizedTranscript normalize(String rawTranscript) {
        if (rawTranscript == null || rawTranscript.isBlank()) {
            return NormalizedTranscript.unchanged(rawTranscript);
        }
        if (!isConfigured()) {
            return NormalizedTranscript.unchanged(rawTranscript);
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("temperature", 0);
            body.put("messages", List.of(
                    Map.of("role", "system", "content", SYSTEM_PROMPT),
                    Map.of("role", "user", "content", rawTranscript)
            ));
            body.put("response_format", responseFormat());

            JsonNode response = openAiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            NormalizedTranscript parsed = parseResponse(response);
            return applySafetyGuard(rawTranscript, parsed);
        } catch (WebClientResponseException ex) {
            log.warn("Transcript normalization API error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.warn("Transcript normalization failed", ex);
        }
        return NormalizedTranscript.unchanged(rawTranscript);
    }

    public String normalizeToText(String rawTranscript) {
        return normalize(rawTranscript).getCorrectedText();
    }

    public static boolean isOverCorrected(String rawTranscript, List<TranscriptCorrection> corrections) {
        int wordCount = wordCount(rawTranscript);
        if (wordCount == 0 || corrections == null || corrections.isEmpty()) {
            return false;
        }
        return corrections.size() > wordCount * MAX_CORRECTION_RATIO;
    }

    private NormalizedTranscript applySafetyGuard(String rawTranscript, NormalizedTranscript parsed) {
        if (parsed == null || parsed.getCorrectedText() == null || parsed.getCorrectedText().isBlank()) {
            return NormalizedTranscript.unchanged(rawTranscript);
        }
        List<TranscriptCorrection> corrections = parsed.getCorrections() != null
                ? parsed.getCorrections()
                : List.of();
        if (isOverCorrected(rawTranscript, corrections)) {
            log.warn("Normalizer sửa quá nhiều, nghi ngờ over-correct: {}", corrections);
            return NormalizedTranscript.unchanged(rawTranscript);
        }
        if (!corrections.isEmpty()) {
            log.debug("Transcript normalized: {} -> {}", rawTranscript, parsed.getCorrectedText());
        }
        return parsed;
    }

    private NormalizedTranscript parseResponse(JsonNode response) throws Exception {
        String content = extractMessageContent(response);
        if (content == null || content.isBlank()) {
            return null;
        }
        JsonNode root = objectMapper.readTree(content);
        String correctedText = root.path("correctedText").asText("");
        List<TranscriptCorrection> corrections = new ArrayList<>();
        JsonNode correctionsNode = root.path("corrections");
        if (correctionsNode.isArray()) {
            for (JsonNode item : correctionsNode) {
                String from = item.path("from").asText("");
                String to = item.path("to").asText("");
                if (!from.isBlank() && !to.isBlank() && !from.equals(to)) {
                    corrections.add(new TranscriptCorrection(from, to));
                }
            }
        }
        return NormalizedTranscript.builder()
                .correctedText(correctedText)
                .corrections(corrections)
                .build();
    }

    private Map<String, Object> responseFormat() {
        Map<String, Object> correctionItem = new HashMap<>();
        correctionItem.put("type", "object");
        correctionItem.put("additionalProperties", false);
        correctionItem.put("properties", Map.of(
                "from", Map.of("type", "string"),
                "to", Map.of("type", "string")
        ));
        correctionItem.put("required", List.of("from", "to"));

        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", Map.of(
                "correctedText", Map.of("type", "string"),
                "corrections", Map.of(
                        "type", "array",
                        "items", correctionItem
                )
        ));
        schema.put("required", List.of("correctedText", "corrections"));

        Map<String, Object> jsonSchema = new HashMap<>();
        jsonSchema.put("name", "normalized_transcript");
        jsonSchema.put("strict", true);
        jsonSchema.put("schema", schema);

        Map<String, Object> format = new HashMap<>();
        format.put("type", "json_schema");
        format.put("json_schema", jsonSchema);
        return format;
    }

    private static String extractMessageContent(JsonNode response) {
        if (response == null) {
            return null;
        }
        return response.path("choices").path(0).path("message").path("content").asText(null);
    }

    private static int wordCount(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }

    private boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
