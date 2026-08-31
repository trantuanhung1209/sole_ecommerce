package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.service.AiChatService;
import www.modules.ai.service.AiOrchestratorService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock private AiOrchestratorService orchestratorService;

    @InjectMocks
    private AiChatService aiChatService;

    @Test
    void chatDelegatesToOrchestrator() {
        AiChatRequest request = new AiChatRequest();
        request.setMessage("giày chạy");
        when(orchestratorService.handle(eq(request), eq("u1")))
                .thenReturn(AiChatResponse.builder().answer("Gợi ý giày chạy").conversationId("c1").build());

        var response = aiChatService.chat("u1", request);

        assertEquals("Gợi ý giày chạy", response.getAnswer());
        verify(orchestratorService).handle(request, "u1");
    }
}
