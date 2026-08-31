package www.modules.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.ChatMessage;
import www.modules.ai.model.AiConversation;
import www.modules.ai.model.AiMessage;
import www.modules.ai.repository.AiConversationRepository;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationHistoryService {

    private static final Duration GUEST_TTL = Duration.ofMinutes(30);

    private final StringRedisTemplate redisTemplate;
    private final AiConversationRepository conversationRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.conversation.history-turns:8}")
    private int historyTurns;

    public List<ChatMessage> getHistory(String conversationId, String userId) {
        if (isGuest(userId)) {
            return getGuestHistory(conversationId);
        }
        if (conversationId == null || conversationId.isBlank()) {
            return List.of();
        }
        return conversationRepository.findById(conversationId)
                .map(conv -> toChatMessages(conv.getMessages()))
                .orElse(List.of());
    }

    public String resolveConversationId(String conversationId, String userId) {
        if (conversationId != null && !conversationId.isBlank()) {
            return conversationId;
        }
        return UUID.randomUUID().toString();
    }

    public void appendHistory(
            String conversationId,
            String userId,
            String userMessage,
            String assistantAnswer) {
        if (isGuest(userId)) {
            appendGuestHistory(conversationId, userMessage, assistantAnswer);
            return;
        }
        appendLoggedInHistory(conversationId, userId, userMessage, assistantAnswer);
    }

    private void appendGuestHistory(String conversationId, String userMessage, String assistantAnswer) {
        List<ChatMessage> history = new ArrayList<>(getGuestHistory(conversationId));
        history.add(ChatMessage.user(userMessage));
        history.add(ChatMessage.assistant(assistantAnswer));
        saveGuestHistory(conversationId, trimHistory(history));
    }

    private void appendLoggedInHistory(
            String conversationId,
            String userId,
            String userMessage,
            String assistantAnswer) {
        AiConversation conversation = conversationRepository.findById(conversationId)
                .orElseGet(() -> AiConversation.builder()
                        .conversationId(conversationId)
                        .userId(userId)
                        .title(truncateTitle(userMessage))
                        .messages(new ArrayList<>())
                        .build());

        if (!userId.equals(conversation.getUserId())) {
            return;
        }

        conversation.getMessages().add(AiMessage.builder().role("user").content(userMessage).build());
        conversation.getMessages().add(AiMessage.builder().role("assistant").content(assistantAnswer).build());
        trimConversationMessages(conversation);
        conversationRepository.save(conversation);
    }

    private List<ChatMessage> getGuestHistory(String conversationId) {
        if (conversationId == null || conversationId.isBlank()) {
            return new ArrayList<>();
        }
        String key = guestKey(conversationId);
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(json, new TypeReference<List<ChatMessage>>() {});
        } catch (Exception ex) {
            log.debug("Guest history read failed: {}", ex.getMessage());
            return new ArrayList<>();
        }
    }

    private void saveGuestHistory(String conversationId, List<ChatMessage> messages) {
        try {
            String json = objectMapper.writeValueAsString(messages);
            redisTemplate.opsForValue().set(guestKey(conversationId), json, GUEST_TTL);
        } catch (Exception ex) {
            log.debug("Guest history write failed: {}", ex.getMessage());
        }
    }

    private List<ChatMessage> toChatMessages(List<AiMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return List.of();
        }
        int start = Math.max(0, messages.size() - historyTurns * 2);
        List<ChatMessage> result = new ArrayList<>();
        for (AiMessage message : messages.subList(start, messages.size())) {
            if (message.getContent() == null || message.getContent().isBlank()) {
                continue;
            }
            String role = "assistant".equalsIgnoreCase(message.getRole()) ? "assistant" : "user";
            result.add("assistant".equals(role)
                    ? ChatMessage.assistant(message.getContent())
                    : ChatMessage.user(message.getContent()));
        }
        return result;
    }

    private List<ChatMessage> trimHistory(List<ChatMessage> messages) {
        int maxMessages = historyTurns * 2;
        if (messages.size() <= maxMessages) {
            return messages;
        }
        return new ArrayList<>(messages.subList(messages.size() - maxMessages, messages.size()));
    }

    private void trimConversationMessages(AiConversation conversation) {
        int maxMessages = historyTurns * 2;
        if (conversation.getMessages().size() > maxMessages) {
            conversation.setMessages(new ArrayList<>(
                    conversation.getMessages().subList(conversation.getMessages().size() - maxMessages, conversation.getMessages().size())
            ));
        }
    }

    private static boolean isGuest(String userId) {
        return userId == null || userId.isBlank() || "guest".equals(userId);
    }

    private static String guestKey(String conversationId) {
        return "chat:history:" + conversationId;
    }

    private static String truncateTitle(String message) {
        if (message == null) {
            return "Chat";
        }
        return message.length() > 60 ? message.substring(0, 60) : message;
    }
}
