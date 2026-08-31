package www.modules.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessage {
    private String role;
    private String content;
    private String toolCallId;
    private String name;
    private List<ToolCall> toolCalls;

    public static ChatMessage system(String content) {
        return ChatMessage.builder().role("system").content(content).build();
    }

    public static ChatMessage user(String content) {
        return ChatMessage.builder().role("user").content(content).build();
    }

    public static ChatMessage assistant(String content) {
        return ChatMessage.builder().role("assistant").content(content).build();
    }

    public static ChatMessage assistantToolCalls(List<ToolCall> toolCalls) {
        return ChatMessage.builder().role("assistant").toolCalls(toolCalls).build();
    }

    public static ChatMessage toolResult(String toolCallId, String content) {
        return ChatMessage.builder().role("tool").toolCallId(toolCallId).content(content).build();
    }
}
