package www.modules.ai.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import www.model.dto.response.ApiResponse;
import www.modules.ai.dto.AiDtos.AiChatRequest;
import www.modules.ai.dto.AiDtos.AiChatResponse;
import www.modules.ai.dto.ImageSearchContext;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.model.AiConversation;
import www.modules.ai.service.*;
import www.security.CustomUserDetailsService.UserPrincipal;
import www.service.interfaces.CloudinaryService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiChatController {
    private final AiChatService aiChatService;
    private final VoiceTranscriptService voiceTranscriptService;
    private final VisionClient visionClient;
    private final AiImageValidator imageValidator;
    private final ImageNormalizer imageNormalizer;
    private final CloudinaryService cloudinaryService;
    private final ImageSearchService imageSearchService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@RequestBody AiChatRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(aiChatService.chat(userId(authentication), request)));
    }

    @PostMapping(value = "/chat/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AiChatResponse>> chatByVoice(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam(value = "conversationId", required = false) String conversationId,
            Authentication authentication) {
        String transcript = voiceTranscriptService.processToText(audioFile);
        AiChatRequest request = new AiChatRequest();
        request.setConversationId(conversationId);
        request.setMessage(transcript);
        return ResponseEntity.ok(ApiResponse.success(
                aiChatService.chatByVoice(userId(authentication), request, transcript)));
    }

    @PostMapping(value = "/chat/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AiChatResponse>> chatByImage(
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "conversationId", required = false) String conversationId,
            @RequestParam(value = "message", required = false) String userMessage,
            Authentication authentication) {
        byte[] inputBytes = imageValidator.validateAndRead(imageFile);
        ImageNormalizer.NormalizedImage normalized = imageNormalizer.normalizeToWebp(inputBytes);
        String filename = UUID.randomUUID() + ".webp";
        String cloudinaryUrl = cloudinaryService.uploadBytes(
                normalized.webpBytes(), "ai-search-temp", filename);

        VisionAnalysis analysis = visionClient.analyzeImage(cloudinaryUrl);
        if (analysis.getDescription() == null || analysis.getDescription().isBlank()) {
            analysis.setDescription(analysis.displayLabel());
        }
        ImageSearchContext imageSearch = imageSearchService.resolve(analysis);

        String identified = analysis.displayLabel();
        String prompt;
        if (userMessage != null && !userMessage.isBlank()) {
            prompt = userMessage.trim() + " — ảnh: " + identified;
        } else if (!identified.isBlank()) {
            prompt = "Tìm giày giống ảnh này: " + identified;
        } else {
            prompt = "Tìm giày giống ảnh này";
        }
        AiChatRequest request = new AiChatRequest();
        request.setConversationId(conversationId);
        request.setMessage(prompt);
        return ResponseEntity.ok(ApiResponse.success(
                aiChatService.chatByImage(userId(authentication), request, cloudinaryUrl, imageSearch)));
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
