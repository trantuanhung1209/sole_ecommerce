package www.modules.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.dto.ChatMessage;
import www.modules.ai.dto.OpenAiChatResult;
import www.modules.ai.dto.ToolCall;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.tool.ToolDefinition;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAiClient {

    private final WebClient openAiWebClient;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    @Value("${openai.structured-output-model:gpt-4o-mini}")
    private String structuredOutputModel;

    @Value("${openai.vision-model:gpt-4o}")
    private String visionModel;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public OpenAiChatResult chat(List<ChatMessage> messages, List<ToolDefinition> tools) {
        if (!isConfigured()) {
            return OpenAiChatResult.builder()
                    .content("Trợ lý AI chưa được cấu hình. Vui lòng đặt OPENAI_API_KEY trên backend.")
                    .build();
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", toApiMessages(messages));
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools.stream().map(ToolDefinition::toApiMap).toList());
            body.put("tool_choice", "auto");
        }

        try {
            JsonNode response = openAiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            return parseChatResult(response);
        } catch (WebClientResponseException ex) {
            log.error("OpenAI chat error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("OpenAI chat request failed", ex);
        }
        return OpenAiChatResult.builder()
                .content("Mình chưa tạo được câu trả lời lúc này. Bạn thử lại sau vài giây nhé.")
                .build();
    }

    public AiChatResponse chatWithStructuredOutput(List<ChatMessage> messages) {
        if (!isConfigured()) {
            return AiChatResponse.builder()
                    .answer("Trợ lý AI chưa được cấu hình. Vui lòng đặt OPENAI_API_KEY trên backend.")
                    .build();
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", structuredOutputModel);
        body.put("messages", toApiMessages(messages));
        body.put("response_format", structuredResponseFormat());

        try {
            JsonNode response = openAiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            String content = extractMessageContent(response);
            if (content == null || content.isBlank()) {
                return fallbackResponse("Mình chưa tạo được câu trả lời lúc này.");
            }
            return objectMapper.readValue(content, AiChatResponse.class);
        } catch (WebClientResponseException ex) {
            log.error("OpenAI structured output error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("OpenAI structured output failed", ex);
        }
        return fallbackResponse("Mình chưa tạo được câu trả lời lúc này. Bạn thử lại sau vài giây nhé.");
    }

    public String describeImage(String imageUrl, String prompt) {
        VisionAnalysis analysis = analyzeImage(imageUrl, prompt);
        if (analysis != null && analysis.getDescription() != null && !analysis.getDescription().isBlank()) {
            return analysis.getDescription();
        }
        return "";
    }

    public VisionAnalysis analyzeImage(String imageUrl, String prompt) {
        if (!isConfigured()) {
            return VisionAnalysis.builder().description("").build();
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", visionModel);
        body.put("max_tokens", 400);
        body.put("messages", List.of(Map.of(
                "role", "user",
                "content", List.of(
                        Map.of("type", "text", "text", prompt),
                        Map.of("type", "image_url", "image_url", Map.of("url", imageUrl))
                )
        )));
        body.put("response_format", visionResponseFormat());

        try {
            JsonNode response = openAiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            String content = extractMessageContent(response);
            if (content == null || content.isBlank()) {
                return VisionAnalysis.builder().description("").build();
            }
            VisionAnalysis parsed = objectMapper.readValue(content, VisionAnalysis.class);
            if (parsed.getDescription() == null || parsed.getDescription().isBlank()) {
                parsed.setDescription(parsed.displayLabel());
            }
            if (parsed.getSearchQuery() == null || parsed.getSearchQuery().isBlank()) {
                parsed.setSearchQuery(parsed.primarySearchQuery());
            }
            return parsed;
        } catch (Exception ex) {
            log.error("OpenAI vision request failed", ex);
            return VisionAnalysis.builder().description("").build();
        }
    }

    private List<Map<String, Object>> toApiMessages(List<ChatMessage> messages) {
        List<Map<String, Object>> apiMessages = new ArrayList<>();
        for (ChatMessage message : messages) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("role", message.getRole());
            if (message.getContent() != null) {
                entry.put("content", message.getContent());
            }
            if (message.getToolCallId() != null) {
                entry.put("tool_call_id", message.getToolCallId());
            }
            if (message.getName() != null) {
                entry.put("name", message.getName());
            }
            if (message.getToolCalls() != null && !message.getToolCalls().isEmpty()) {
                entry.put("tool_calls", message.getToolCalls().stream().map(tc -> {
                    Map<String, Object> call = new HashMap<>();
                    call.put("id", tc.getId());
                    call.put("type", tc.getType() != null ? tc.getType() : "function");
                    Map<String, Object> fn = new HashMap<>();
                    fn.put("name", tc.getFunction().getName());
                    fn.put("arguments", tc.getFunction().getArguments());
                    call.put("function", fn);
                    return call;
                }).toList());
            }
            apiMessages.add(entry);
        }
        return apiMessages;
    }

    private OpenAiChatResult parseChatResult(JsonNode response) {
        if (response == null) {
            return OpenAiChatResult.builder().build();
        }
        JsonNode message = response.path("choices").path(0).path("message");
        String content = message.path("content").isNull() ? null : message.path("content").asText(null);

        List<ToolCall> toolCalls = new ArrayList<>();
        JsonNode toolCallsNode = message.path("tool_calls");
        if (toolCallsNode.isArray()) {
            for (JsonNode tc : toolCallsNode) {
                toolCalls.add(ToolCall.builder()
                        .id(tc.path("id").asText())
                        .type(tc.path("type").asText("function"))
                        .function(ToolCall.FunctionCall.builder()
                                .name(tc.path("function").path("name").asText())
                                .arguments(tc.path("function").path("arguments").asText("{}"))
                                .build())
                        .build());
            }
        }
        return OpenAiChatResult.builder().content(content).toolCalls(toolCalls).build();
    }

    private String extractMessageContent(JsonNode response) {
        if (response == null) {
            return null;
        }
        return response.path("choices").path(0).path("message").path("content").asText(null);
    }

    private Map<String, Object> visionResponseFormat() {
        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", Map.of(
                "brand", Map.of("type", "string"),
                "model", Map.of("type", "string"),
                "color", Map.of("type", "string"),
                "style", Map.of("type", "string"),
                "category", Map.of("type", "string"),
                "description", Map.of("type", "string"),
                "searchQuery", Map.of("type", "string"),
                "brandIdentified", Map.of("type", "boolean")
        ));
        schema.put("required", List.of(
                "brand", "model", "color", "style", "category",
                "description", "searchQuery", "brandIdentified"
        ));

        Map<String, Object> jsonSchema = new HashMap<>();
        jsonSchema.put("name", "vision_analysis");
        jsonSchema.put("strict", true);
        jsonSchema.put("schema", schema);

        Map<String, Object> format = new HashMap<>();
        format.put("type", "json_schema");
        format.put("json_schema", jsonSchema);
        return format;
    }

    private Map<String, Object> structuredResponseFormat() {
        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", Map.of(
                "answer", Map.of("type", "string"),
                "suggestedProducts", Map.of(
                        "type", "array",
                        "items", Map.of(
                                "type", "object",
                                "additionalProperties", false,
                                "properties", Map.of(
                                        "productId", Map.of("type", "string"),
                                        "name", Map.of("type", "string"),
                                        "slug", Map.of("type", "string"),
                                        "minPrice", Map.of("type", "number"),
                                        "imageUrl", Map.of("type", "string")
                                ),
                                "required", List.of("productId", "name", "slug", "minPrice")
                        )
                ),
                "warnings", Map.of(
                        "type", "array",
                        "items", Map.of("type", "string")
                )
        ));
        schema.put("required", List.of("answer", "suggestedProducts", "warnings"));

        Map<String, Object> jsonSchema = new HashMap<>();
        jsonSchema.put("name", "chat_response");
        jsonSchema.put("strict", true);
        jsonSchema.put("schema", schema);

        Map<String, Object> format = new HashMap<>();
        format.put("type", "json_schema");
        format.put("json_schema", jsonSchema);
        return format;
    }

    private AiChatResponse fallbackResponse(String answer) {
        return AiChatResponse.builder().answer(answer).build();
    }
}
