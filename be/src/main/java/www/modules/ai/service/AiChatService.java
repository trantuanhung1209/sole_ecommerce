package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.exception.NotFoundException;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.model.AiConversation;
import www.modules.ai.model.AiMessage;
import www.modules.ai.repository.AiConversationRepository;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiChatService {
    private final AiConversationRepository conversationRepository;
    private final AiRouterService routerService;
    private final ProductContextService contextService;
    private final OpenAiChatAdapter openAiChatAdapter;

    public AiChatResponse chat(String userId, AiChatRequest request) {
        AiConversation conversation = getOrCreate(userId, request.getConversationId(), request.getMessage());
        AiRouteType route = routerService.route(request.getMessage());
        String context = contextService.buildContext(request.getMessage());
        String answer = openAiChatAdapter.answer(request.getMessage(), context);

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
