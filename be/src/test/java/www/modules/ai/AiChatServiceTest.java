package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.ai.dto.AiContextResult;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.model.AiConversation;
import www.modules.ai.repository.AiConversationRepository;
import www.modules.ai.service.*;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {
    @Mock private AiConversationRepository conversationRepository;
    @Mock private AiRouterService routerService;
    @Mock private AiContextBuilder contextBuilder;
    @Mock private OpenAiChatAdapter openAiChatAdapter;

    @InjectMocks
    private AiChatService aiChatService;

    @Test
    void chat_populatesSuggestedProductsAndWarnings() {
        AiConversation conversation = AiConversation.builder()
                .conversationId("c1")
                .userId("u1")
                .messages(new ArrayList<>())
                .build();
        when(conversationRepository.findById("c1")).thenReturn(java.util.Optional.of(conversation));
        when(routerService.route("giày chạy")).thenReturn(AiRouteType.PRODUCT_INFO);
        when(contextBuilder.build(eq("u1"), eq(AiRouteType.PRODUCT_INFO), eq("giày chạy"), eq(conversation)))
                .thenReturn(AiContextResult.builder()
                        .contextText("ctx")
                        .suggestedProducts(List.of(
                                SuggestedProduct.builder().productId("p1").name("Runner").slug("runner").minPrice(1000000.0).build()
                        ))
                        .warnings(List.of("warn"))
                        .build());
        when(openAiChatAdapter.answer(eq(AiRouteType.PRODUCT_INFO), eq("ctx"), anyList(), eq("giày chạy")))
                .thenReturn("Gợi ý giày chạy");
        when(conversationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AiChatRequest request = new AiChatRequest();
        request.setConversationId("c1");
        request.setMessage("giày chạy");

        var response = aiChatService.chat("u1", request);

        assertEquals("Gợi ý giày chạy", response.getAnswer());
        assertFalse(response.getSuggestedProducts().isEmpty());
        assertEquals("p1", response.getSuggestedProducts().get(0).getProductId());
        assertEquals(List.of("warn"), response.getWarnings());
        verify(conversationRepository).save(conversation);
    }
}
