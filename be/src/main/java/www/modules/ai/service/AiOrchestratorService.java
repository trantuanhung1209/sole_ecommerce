package www.modules.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.dto.ChatMessage;
import www.modules.ai.dto.ImageSearchContext;
import www.modules.ai.dto.OpenAiChatResult;
import www.modules.ai.dto.ToolCall;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.tool.CatalogSearchTool;
import www.modules.ai.tool.OrderStatusTool;
import www.modules.ai.tool.PolicyTool;
import www.modules.ai.tool.ReturnInfoTool;
import www.modules.ai.tool.ToolDefinition;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiOrchestratorService {

    private final OpenAiClient openAiClient;
    private final ToolDispatcher toolDispatcher;
    private final ConversationHistoryService historyService;
    private final ObjectMapper objectMapper;

    @Value("${openai.max-tool-loop:4}")
    private int maxToolLoop;

    public AiChatResponse handle(AiChatRequest request, String userId) {
        return handle(request, userId, null);
    }

    public AiChatResponse handle(AiChatRequest request, String userId, ImageSearchContext imageSearch) {
        String normalizedUserId = normalizeUserId(userId);
        boolean loggedIn = normalizedUserId != null;
        String conversationId = historyService.resolveConversationId(request.getConversationId(), normalizedUserId);

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.system(AiPromptTemplates.systemPrompt(loggedIn)));
        if (imageSearch != null) {
            messages.add(ChatMessage.system(AiPromptTemplates.imageSearchPrompt(imageSearch)));
        }
        messages.addAll(historyService.getHistory(conversationId, normalizedUserId));
        messages.add(ChatMessage.user(request.getMessage()));

        if (imageSearch != null && !imageSearch.exactMatch()) {
            return buildImageSearchNoMatchResponse(
                    conversationId, normalizedUserId, request.getMessage(), imageSearch);
        }

        List<ToolDefinition> tools = imageSearch != null
                ? resolveToolsWithoutCatalog(normalizedUserId)
                : resolveToolsForUser(normalizedUserId);
        List<Object> toolResults = new ArrayList<>();

        int loopCount = 0;
        OpenAiChatResult result = imageSearch != null
                ? OpenAiChatResult.builder().build()
                : openAiClient.chat(messages, tools);

        while (!imageSearchMode(imageSearch) && result.hasToolCalls() && loopCount < maxToolLoop) {
            messages.add(ChatMessage.assistantToolCalls(result.getToolCalls()));

            for (ToolCall call : result.getToolCalls()) {
                Object toolResult = executeTool(call, normalizedUserId);
                toolResults.add(toolResult);
                String content = serializeToolResult(toolResult);
                messages.add(ChatMessage.toolResult(call.getId(), content));
            }

            result = openAiClient.chat(messages, tools);
            loopCount++;
        }

        if (result.getContent() != null && !result.getContent().isBlank()) {
            messages.add(ChatMessage.assistant(result.getContent()));
        }

        messages.add(ChatMessage.user(
                "Hãy tổng hợp câu trả lời cuối cùng dựa trên toàn bộ hội thoại và kết quả tool ở trên. "
                        + "Trả về JSON theo schema đã định. "
                        + "Trường answer: 1–2 câu mở đầu thân thiện + 1 câu gợi ý bước tiếp theo; "
                        + "nếu có suggestedProducts thì KHÔNG lặp lại danh sách tên/giá/chi tiết sản phẩm trong answer. "
                        + "Có thể dùng **in đậm** ngắn; KHÔNG dùng markdown ảnh. "
                        + "Điền đầy đủ suggestedProducts từ kết quả tool."));
        AiChatResponse response = openAiClient.chatWithStructuredOutput(messages);

        if (isFallbackAnswer(response.getAnswer()) && result.getContent() != null && !result.getContent().isBlank()) {
            response.setAnswer(result.getContent());
        }

        List<SuggestedProduct> fromTools = toolDispatcher.extractSuggestedProducts(toolResults);
        response.setSuggestedProducts(mergeSuggestedProducts(response.getSuggestedProducts(), fromTools));
        response.setSuggestedProducts(applyImageSearchProducts(imageSearch, response.getSuggestedProducts()));
        response.setAnswer(sanitizeAnswer(response.getAnswer()));
        if (imageSearch != null && imageSearch.exactMatch() && isFallbackAnswer(response.getAnswer())) {
            response.setAnswer(ImageSearchResponses.exactMatchAnswer(imageSearch.vision()));
        }
        applyImageSearchWarnings(imageSearch, response);

        if (!loggedIn && mentionsOrderIntent(request.getMessage())) {
            List<String> warnings = response.getWarnings() != null
                    ? new ArrayList<>(response.getWarnings())
                    : new ArrayList<>();
            if (!warnings.contains("Đăng nhập để xem đơn hàng của bạn.")) {
                warnings.add("Đăng nhập để xem đơn hàng của bạn.");
            }
            response.setWarnings(warnings);
        }

        historyService.appendHistory(conversationId, normalizedUserId, request.getMessage(), response.getAnswer());
        response.setConversationId(conversationId);
        return response;
    }

    public AiChatResponse handleWithExtras(
            AiChatRequest request,
            String userId,
            String transcript,
            String sourceImageUrl,
            ImageSearchContext imageSearch) {
        AiChatResponse response = handle(request, userId, imageSearch);
        response.setTranscript(transcript);
        response.setSourceImageUrl(sourceImageUrl);
        return response;
    }

    public AiChatResponse handleWithExtras(AiChatRequest request, String userId, String transcript, String sourceImageUrl) {
        return handleWithExtras(request, userId, transcript, sourceImageUrl, null);
    }

    public List<ToolDefinition> resolveToolsForUser(String userId) {
        List<ToolDefinition> tools = new ArrayList<>(List.of(
                CatalogSearchTool.DEFINITION,
                PolicyTool.DEFINITION
        ));
        if (userId != null) {
            tools.add(OrderStatusTool.DEFINITION);
            tools.add(ReturnInfoTool.DEFINITION);
        }
        return tools;
    }

    public List<ToolDefinition> resolveToolsWithoutCatalog(String userId) {
        List<ToolDefinition> tools = new ArrayList<>(List.of(PolicyTool.DEFINITION));
        if (userId != null) {
            tools.add(OrderStatusTool.DEFINITION);
            tools.add(ReturnInfoTool.DEFINITION);
        }
        return tools;
    }

    private Object executeTool(ToolCall call, String userId) {
        try {
            return toolDispatcher.dispatch(
                    call.getFunction().getName(),
                    call.getFunction().getArguments(),
                    userId
            );
        } catch (Exception ex) {
            log.warn("Tool {} failed: {}", call.getFunction().getName(), ex.getMessage());
            return Map.of("error", ex.getMessage());
        }
    }

    private String serializeToolResult(Object toolResult) {
        try {
            return objectMapper.writeValueAsString(toolResult);
        } catch (Exception ex) {
            return String.valueOf(toolResult);
        }
    }

    private static String normalizeUserId(String userId) {
        if (userId == null || userId.isBlank() || "guest".equals(userId)) {
            return null;
        }
        return userId;
    }

    private static boolean mentionsOrderIntent(String message) {
        if (message == null) {
            return false;
        }
        String text = message.toLowerCase();
        return text.contains("đơn") || text.contains("order") || text.contains("giao")
                || text.contains("đổi") || text.contains("trả") || text.contains("hoàn");
    }

    private static List<SuggestedProduct> mergeSuggestedProducts(
            List<SuggestedProduct> fromLlm,
            List<SuggestedProduct> fromTools) {
        if (fromTools == null || fromTools.isEmpty()) {
            return fromLlm != null ? dedupeProducts(fromLlm) : List.of();
        }
        Map<String, SuggestedProduct> toolById = new LinkedHashMap<>();
        for (SuggestedProduct product : fromTools) {
            if (product.getProductId() != null) {
                toolById.putIfAbsent(product.getProductId(), product);
            }
        }
        if (fromLlm == null || fromLlm.isEmpty()) {
            return dedupeProducts(fromTools);
        }

        List<SuggestedProduct> merged = new ArrayList<>();
        for (SuggestedProduct llmProduct : fromLlm) {
            SuggestedProduct toolProduct = llmProduct.getProductId() != null
                    ? toolById.get(llmProduct.getProductId())
                    : null;
            if (toolProduct != null) {
                merged.add(SuggestedProduct.builder()
                        .productId(llmProduct.getProductId())
                        .name(firstNonBlank(llmProduct.getName(), toolProduct.getName()))
                        .slug(firstNonBlank(llmProduct.getSlug(), toolProduct.getSlug()))
                        .minPrice(llmProduct.getMinPrice() != null ? llmProduct.getMinPrice() : toolProduct.getMinPrice())
                        .imageUrl(firstNonBlank(toolProduct.getImageUrl(), llmProduct.getImageUrl()))
                        .build());
            } else {
                merged.add(llmProduct);
            }
        }
        return dedupeProducts(merged);
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback;
    }

    private static String sanitizeAnswer(String answer) {
        if (answer == null) {
            return null;
        }
        return answer
                .replaceAll("!\\[[^\\]]*]\\([^)]*\\)", "")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private static List<SuggestedProduct> dedupeProducts(List<SuggestedProduct> products) {
        Map<String, SuggestedProduct> unique = new LinkedHashMap<>();
        for (SuggestedProduct product : products) {
            if (product.getProductId() != null) {
                unique.putIfAbsent(product.getProductId(), product);
            }
        }
        return new ArrayList<>(unique.values());
    }

    private static boolean isFallbackAnswer(String answer) {
        return answer != null && answer.contains("Mình chưa tạo được câu trả lời");
    }

    private static boolean imageSearchMode(ImageSearchContext imageSearch) {
        return imageSearch != null;
    }

    private static List<SuggestedProduct> applyImageSearchProducts(
            ImageSearchContext imageSearch,
            List<SuggestedProduct> current) {
        if (imageSearch == null) {
            return current;
        }
        if (imageSearch.exactMatch()) {
            return imageSearch.products() != null ? imageSearch.products() : List.of();
        }
        return List.of();
    }

    private static void applyImageSearchWarnings(ImageSearchContext imageSearch, AiChatResponse response) {
        if (imageSearch == null || imageSearch.exactMatch()) {
            return;
        }
        String warning = ImageSearchResponses.noMatchWarning(imageSearch.vision());
        List<String> warnings = response.getWarnings() != null
                ? new ArrayList<>(response.getWarnings())
                : new ArrayList<>();
        if (!warnings.contains(warning)) {
            warnings.add(warning);
        }
        response.setWarnings(warnings);
    }

    private AiChatResponse buildImageSearchNoMatchResponse(
            String conversationId,
            String normalizedUserId,
            String userMessage,
            ImageSearchContext imageSearch) {
        VisionAnalysis vision = imageSearch.vision();
        AiChatResponse response = AiChatResponse.builder()
                .conversationId(conversationId)
                .answer(ImageSearchResponses.noMatchAnswer(vision))
                .suggestedProducts(List.of())
                .warnings(List.of(ImageSearchResponses.noMatchWarning(vision)))
                .build();
        historyService.appendHistory(conversationId, normalizedUserId, userMessage, response.getAnswer());
        return response;
    }
}
