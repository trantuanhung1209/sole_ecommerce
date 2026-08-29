package www.modules.ai.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.model.AiConversation;
import www.modules.ai.service.AiChatService;
import www.security.CustomUserDetailsService.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiChatController {
    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@RequestBody AiChatRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(aiChatService.chat(userId(authentication), request)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversation>>> conversations(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(aiChatService.conversations(userId(authentication))));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<AiConversation>> conversation(
            @PathVariable String conversationId,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(aiChatService.conversation(conversationId, userId(authentication))));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String conversationId, Authentication authentication) {
        aiChatService.delete(conversationId, userId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted", null));
    }

    private String userId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return "guest";
        }
        return ((UserPrincipal) authentication.getPrincipal()).getId();
    }
}
