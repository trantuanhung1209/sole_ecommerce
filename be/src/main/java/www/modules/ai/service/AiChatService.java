package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.exception.NotFoundException;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.dto.ImageSearchContext;
import www.modules.ai.model.AiConversation;
import www.modules.ai.repository.AiConversationRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiChatService {
    private final AiConversationRepository conversationRepository;
    private final AiOrchestratorService orchestratorService;

    public AiChatResponse chat(String userId, AiChatRequest request) {
        return orchestratorService.handle(request, userId);
    }

    public AiChatResponse chatByVoice(String userId, AiChatRequest request, String transcript) {
        return orchestratorService.handleWithExtras(request, userId, transcript, null);
    }

    public AiChatResponse chatByImage(String userId, AiChatRequest request, String sourceImageUrl, ImageSearchContext imageSearch) {
        return orchestratorService.handleWithExtras(request, userId, null, sourceImageUrl, imageSearch);
    }

    public List<AiConversation> conversations(String userId) {
        if (isGuest(userId)) {
            return List.of();
        }
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public AiConversation conversation(String conversationId, String userId) {
        if (isGuest(userId)) {
            throw new NotFoundException("Conversation not found");
        }
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

    public AiConversation getOrCreate(String userId, String conversationId, String firstMessage) {
        if (isGuest(userId)) {
            return null;
        }
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

    private static boolean isGuest(String userId) {
        return userId == null || userId.isBlank() || "guest".equals(userId);
    }
}
