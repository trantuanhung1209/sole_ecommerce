package www.modules.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import www.modules.ai.dto.AiDtos.AiChatResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiChatResponseDeserializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesStructuredOutputJson() throws Exception {
        String json = """
                {"answer":"Xin chào","suggestedProducts":[],"warnings":[]}
                """;
        AiChatResponse response = objectMapper.readValue(json, AiChatResponse.class);
        assertEquals("Xin chào", response.getAnswer());
    }
}
