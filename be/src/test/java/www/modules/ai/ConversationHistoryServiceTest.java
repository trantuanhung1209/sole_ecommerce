package www.modules.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;
import www.modules.ai.dto.ChatMessage;
import www.modules.ai.model.AiConversation;
import www.modules.ai.model.AiMessage;
import www.modules.ai.repository.AiConversationRepository;
import www.modules.ai.service.ConversationHistoryService;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationHistoryServiceTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private AiConversationRepository conversationRepository;

    private ConversationHistoryService service;

    @BeforeEach
    void setUp() {
        service = new ConversationHistoryService(redisTemplate, conversationRepository, new ObjectMapper());
        ReflectionTestUtils.setField(service, "historyTurns", 8);
    }

    @Test
    void getHistoryReturnsMessagesForOwnerAndBlocksCrossUserAccess() {
        AiConversation conv = AiConversation.builder()
                .conversationId("conv-1")
                .userId("user-a")
                .messages(List.of(
                        AiMessage.builder().role("user").content("Secret query").build(),
                        AiMessage.builder().role("assistant").content("Private order info").build()
                ))
                .build();
        when(conversationRepository.findById("conv-1")).thenReturn(Optional.of(conv));

        List<ChatMessage> ownerHistory = service.getHistory("conv-1", "user-a");
        assertThat(ownerHistory).hasSize(2);
        assertThat(ownerHistory.get(0).getContent()).isEqualTo("Secret query");

        List<ChatMessage> attackerHistory = service.getHistory("conv-1", "user-b");
        assertThat(attackerHistory).isEmpty();
    }

    @Test
    void resolveConversationIdReplacesForeignConversationIdWithFreshUuid() {
        AiConversation foreign = AiConversation.builder()
                .conversationId("conv-1")
                .userId("user-a")
                .build();
        when(conversationRepository.findById("conv-1")).thenReturn(Optional.of(foreign));

        assertThat(service.resolveConversationId("conv-1", "user-a")).isEqualTo("conv-1");

        String resolvedForB = service.resolveConversationId("conv-1", "user-b");
        assertThat(resolvedForB).isNotBlank().isNotEqualTo("conv-1");
    }

    @Test
    void guestHistoryReadsFromRedisWithoutTouchingConversationRepository() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("chat:history:conv-guest")).thenReturn("[{\"role\":\"user\",\"content\":\"Hi\"}]");

        List<ChatMessage> guest = service.getHistory("conv-guest", "guest");
        assertThat(guest).hasSize(1);
        assertThat(guest.get(0).getContent()).isEqualTo("Hi");
        verifyNoInteractions(conversationRepository);
    }
}
