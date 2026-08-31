package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.dto.ChatMessage;
import www.modules.ai.dto.OpenAiChatResult;
import www.modules.ai.dto.ToolCall;
import www.modules.ai.service.AiOrchestratorService;
import www.modules.ai.service.ConversationHistoryService;
import www.modules.ai.service.OpenAiClient;
import www.modules.ai.service.ToolDispatcher;
import www.modules.ai.tool.CatalogSearchTool;
import www.modules.ai.tool.OrderStatusTool;
import www.modules.ai.tool.PolicyTool;
import www.modules.ai.tool.ReturnInfoTool;
import www.modules.ai.tool.ToolDefinition;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiOrchestratorServiceTest {

    @Mock private OpenAiClient openAiClient;
    @Mock private ToolDispatcher toolDispatcher;
    @Mock private ConversationHistoryService historyService;
    @Mock(lenient = true) private ObjectMapper objectMapper;

    @InjectMocks
    private AiOrchestratorService orchestratorService;

    @Test
    void guestToolsExcludeOrderAndReturn() {
        List<ToolDefinition> tools = orchestratorService.resolveToolsForUser(null);
        assertEquals(2, tools.size());
        assertTrue(tools.stream().anyMatch(t -> CatalogSearchTool.DEFINITION.name().equals(t.name())));
        assertTrue(tools.stream().anyMatch(t -> PolicyTool.DEFINITION.name().equals(t.name())));
        assertFalse(tools.stream().anyMatch(t -> OrderStatusTool.DEFINITION.name().equals(t.name())));
        assertFalse(tools.stream().anyMatch(t -> ReturnInfoTool.DEFINITION.name().equals(t.name())));
    }

    @Test
    void loggedInToolsIncludeAllFour() {
        List<ToolDefinition> tools = orchestratorService.resolveToolsForUser("u1");
        assertEquals(4, tools.size());
    }

    @Test
    void stopsAfterMaxToolLoop() throws Exception {
        when(historyService.resolveConversationId(any(), any())).thenReturn("c1");
        when(historyService.getHistory(any(), any())).thenReturn(List.of());

        ToolCall endlessCall = ToolCall.builder()
                .id("call_1")
                .type("function")
                .function(ToolCall.FunctionCall.builder()
                        .name("search_catalog")
                        .arguments("{\"query\":\"nike\"}")
                        .build())
                .build();

        OpenAiChatResult toolResult = OpenAiChatResult.builder()
                .toolCalls(List.of(endlessCall))
                .build();
        when(openAiClient.chat(anyList(), anyList())).thenReturn(toolResult);
        when(toolDispatcher.dispatch(anyString(), anyString(), isNull())).thenReturn(java.util.Map.of("count", 0));
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(openAiClient.chatWithStructuredOutput(anyList())).thenReturn(
                AiChatResponse.builder().answer("done").build());

        AiChatRequest request = new AiChatRequest();
        request.setMessage("nike size 42");

        orchestratorService.handle(request, "guest");

        verify(openAiClient, atMost(5)).chat(anyList(), anyList());
    }
}
