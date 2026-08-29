package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.exception.NotFoundException;
import www.modules.ai.dto.AiContextResult;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.model.AiConversation;
import www.modules.ai.model.AiMessage;
import www.modules.ai.repository.AiConversationRepository;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiChatService {
    private final AiConversationRepository conversationRepository;
    private final AiRouterService routerService;
    private final AiContextBuilder contextBuilder;
    private final OpenAiChatAdapter openAiChatAdapter;

    public AiChatResponse chat(String userId, AiChatRequest request) {
        AiConversation conversation = getOrCreate(userId, request.getConversationId(), request.getMessage());
        AiRouteType route = routerService.route(request.getMessage());
        AiContextResult context = contextBuilder.build(userId, route, request.getMessage(), conversation);

        List<AiMessage> priorMessages = new ArrayList<>(conversation.getMessages());
        String answer = openAiChatAdapter.answer(
                route,
                context.getContextText(),
                priorMessages,
                request.getMessage()
        );

        conversation.getMessages().add(AiMessage.builder()
                .role("user")
                .content(request.getMessage())
                .routeType(route.name())
                .timestamp(LocalDateTime.now())
                .build());
        conversation.getMessages().add(AiMessage.builder()
                .role("assistant")
                .content(answer)
                .routeType(route.name())
                .timestamp(LocalDateTime.now())
                .build());
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return AiChatResponse.builder()
                .conversationId(conversation.getConversationId())
                .routeType(route)
                .answer(answer)
                .suggestedProducts(context.getSuggestedProducts())
                .warnings(context.getWarnings())
                .build();
    }

    public List<AiConversation> conversations(String userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public AiConversation conversation(String conversationId, String userId) {
        AiConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));
        if (!conversation.getUserId().equals(userId)) {
            throw new NotFoundException("Conversation not found");
        }
        return conversation;
    }

    public void delete(String conversationId, String userId) {
        conversation(conversationId, userId);
        conversationRepository.deleteById(conversationId);
    }

    private AiConversation getOrCreate(String userId, String conversationId, String firstMessage) {
        if (conversationId != null && !conversationId.isBlank()) {
            return conversation(conversationId, userId);
        }
        LocalDateTime now = LocalDateTime.now();
        return conversationRepository.save(AiConversation.builder()
                .userId(userId)
                .title(firstMessage != null && firstMessage.length() > 60 ? firstMessage.substring(0, 60) : firstMessage)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }
}
