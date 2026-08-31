# Tài liệu Implementation: AI Chat với OpenAI Function Calling

> **Trạng thái:** ✅ Đã triển khai (08/2026) — thay thế routing keyword `AiRouterService` bằng orchestrator + function calling.  
> **Cập nhật gần nhất (08/2026):** Voice pipeline 3 lớp — Whisper domain prompt + lọc hallucination (`verbose_json`) + `TranscriptNormalizerService` (ASR correction); visual search `gpt-4o` + `ImageSearchService`.  
> **Tài liệu liên quan:** [`SHOE_ECOMMERCE_SPECIFICATION.md`](./SHOE_ECOMMERCE_SPECIFICATION.md) §15, [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md) §13.

**Phạm vi:** Module AI chat dùng **OpenAI Function Calling** + Structured Outputs, tích hợp Spring Boot + MongoDB + Redis + Cloudinary.

**Stack liên quan:** Java 17, Spring Boot 3.5, Spring Security, Spring Data MongoDB, Redis, Cloudinary, OpenAI API (`/v1/chat/completions`, Whisper, Vision).

### Code chính (đã có trong repo)

| Thành phần | Package / file |
|------------|----------------|
| Controller | `be/.../ai/controller/AiChatController.java` |
| Orchestrator | `be/.../ai/service/AiOrchestratorService.java` |
| OpenAI client | `be/.../ai/service/OpenAiClient.java`, `be/.../config/OpenAiConfig.java` |
| Tools | `be/.../ai/tool/*`, `be/.../ai/service/ToolDispatcher.java` |
| History | `be/.../ai/service/ConversationHistoryService.java` |
| Voice | `WhisperClient`, `WhisperTranscriptFilter`, `TranscriptNormalizerService`, `VoiceTranscriptService`, `AiAudioValidator` |
| DTO voice | `WhisperVerboseResponse`, `WhisperSegment`, `NormalizedTranscript`, `TranscriptCorrection` |
| Visual search | `VisionClient.java`, `ImageSearchService.java`, `ImageSearchMatcher.java`, `ImageNormalizer.java`, `AiImageValidator.java` |
| DTO image search | `be/.../ai/dto/VisionAnalysis.java`, `ImageSearchContext.java` |
| FE | `fe/src/components/AiChatComposer/`, `FloatingChatbot/`, `AiMessageContent/`, `AiChatPage.tsx`, `fe/src/config/publicNavigation.ts` (menu **Trợ lý AI**), `fe/src/services/ecommerceServices.ts` (`aiApi`) |

### Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/ai/chat` | Text chat — JSON `{ conversationId?, message }` |
| `POST` | `/ai/chat/voice` | Multipart `audio` + `conversationId?` → `VoiceTranscriptService` (Whisper + filter + normalize) → orchestrator |
| `POST` | `/ai/chat/image` | Multipart `image` + `conversationId?` + `message?` (caption) → WebP → Cloudinary → Vision (`gpt-4o`) → `ImageSearchService` → orchestrator (image mode) |
| `GET/DELETE` | `/ai/conversations/**` | Lịch sử hội thoại (auth, MongoDB) |

### Changelog gần đây (08/2026)

| Thay đổi | Mô tả |
|----------|--------|
| **Vision `gpt-4o`** | `OPENAI_VISION_MODEL=gpt-4o`; structured `VisionAnalysis` (brand, model, searchQuery, brandIdentified) |
| **ImageSearchService** | Tìm catalog + `ImageSearchMatcher` lọc theo brand/model; không gợi ý SP sai |
| **Image search mode** | Orchestrator bỏ `search_catalog` khi gửi ảnh; force `suggestedProducts=[]` nếu không khớp |
| **Caption ảnh** | Param `message` trên `POST /ai/chat/image` |
| **FE AiChatComposer** | Menu `+`, preview ảnh + caption, optimistic UI, clear preview khi gửi |
| **FE AiMessageContent** | Format answer (bold, list); không lặp SP trong text khi có cards |
| **Menu header** | **Trợ lý AI** → `/ai-chat` (thay Đánh giá) |
| **Timeout** | AI API 120s; public API 30s |
| **Audio WebM** | Fix magic bytes validator; `getSupportedAudioFormat()` trên FE |
| **WebP image** | `ImageIoConfig` scan plugins; WebP pass-through khi Java 17 không đọc được |
| **Context path** | `server.servlet.context-path=/api` |
| **Whisper hallucination filter** | `verbose_json` + lọc `no_speech_prob` / `avg_logprob` + blacklist YouTube outro |
| **Whisper domain prompt** | `prompt` gợi ý vocab giày dép/thể thao (Nike, size, bóng rổ…) |
| **TranscriptNormalizer** | `gpt-4o-mini` sửa lỗi ASR domain (vd. *bóng rục* → *bóng rổ*); guard over-correct >40% |
| **FE voice guard** | `MIN_RECORDING_MS=800` — không gửi audio quá ngắn |
| **ImageSearchResponses** | Câu trả lời cố định khi không khớp catalog (không fallback LLM) |

---

## 1. Mục tiêu

- Thay routing `if/else` cứng (`CATALOG / POLICY / ORDER / RETURN`) bằng cơ chế để model OpenAI tự quyết định gọi tool nào, có thể gọi **nhiều tool trong 1 lượt hỏi**.
- Đảm bảo dữ liệu nhạy cảm (đơn hàng, đổi trả) luôn được backend kiểm soát quyền truy cập, model không tự suy diễn hay "bịa" dữ liệu.
- Trả về response có cấu trúc cố định (`answer`, `suggestedProducts`, `warnings`) bằng OpenAI Structured Outputs.
- Chuẩn hoá để dễ mở rộng thêm tool mới (visual search, so sánh sản phẩm...) sau này.

---

## 2. Kiến trúc tổng quan

```
React Client
   │  POST /ai/chat  { message, conversationId }
   ▼
Spring Boot – AiChatController
   │  - Xác thực (Spring Security) → lấy userId (hoặc null nếu Guest)
   │  - Lấy lịch sử hội thoại từ Redis (theo conversationId)
   ▼
AiOrchestratorService
   │  - Build messages[] gồm system prompt + history + user message
   │  - Gọi OpenAiClient.chat(messages, tools)
   ▼
OpenAI API (chat.completions / responses API)
   │  - Model quyết định: trả lời trực tiếp HOẶC gọi 1..N tool_calls
   ▼
ToolDispatcher (Java)
   │  - Map tool_call.name → Java method tương ứng
   │  - Inject userId/security context, KHÔNG lấy từ argument của model
   │  - Gọi CatalogService / PolicyService / OrderService / ReturnService
   ▼
Trả tool_result về lại OpenAI → model tổng hợp câu trả lời cuối
   ▼
Structured Output (JSON Schema) → parse vào DTO
   ▼
Spring Boot trả JSON { answer, suggestedProducts, warnings } về Client
```

Vòng lặp `OpenAI ↔ ToolDispatcher` có thể lặp tối đa **N lần** (khuyến nghị N = 3–4) để tránh loop vô hạn hoặc lạm dụng token.

---

## 3. Định nghĩa Tool (Function Schema)

Tạo 4 tool ban đầu, tương ứng đúng 4 nhánh cũ (`CATALOG`, `POLICY`, `ORDER`, `RETURN`):

### 3.1. `search_catalog`
```json
{
  "type": "function",
  "function": {
    "name": "search_catalog",
    "description": "Tìm kiếm sản phẩm giày trong catalog theo từ khóa và bộ lọc (size, màu, giá, thương hiệu).",
    "parameters": {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "Từ khóa tìm kiếm, ví dụ: 'giày chạy bộ Nike'" },
        "size": { "type": "string", "description": "Size giày, ví dụ: '42'" },
        "color": { "type": "string" },
        "minPrice": { "type": "number" },
        "maxPrice": { "type": "number" },
        "category": { "type": "string", "description": "Loại giày: sneaker, running, boot..." }
      },
      "required": ["query"]
    }
  }
}
```

### 3.2. `get_policy`
```json
{
  "type": "function",
  "function": {
    "name": "get_policy",
    "description": "Lấy nội dung chính sách của shop (đổi trả, thanh toán, vận chuyển, bảo hành).",
    "parameters": {
      "type": "object",
      "properties": {
        "topic": {
          "type": "string",
          "enum": ["return", "payment", "shipping", "warranty", "order"]
        }
      },
      "required": ["topic"]
    }
  }
}
```

### 3.3. `get_order_status`
```json
{
  "type": "function",
  "function": {
    "name": "get_order_status",
    "description": "Lấy trạng thái đơn hàng của người dùng đang đăng nhập. Chỉ dùng khi user đã login.",
    "parameters": {
      "type": "object",
      "properties": {
        "orderId": { "type": "string", "description": "Mã đơn hàng, nếu user không cung cấp thì để trống để lấy đơn gần nhất" }
      },
      "required": []
    }
  }
}
```

### 3.4. `get_return_info` (thay `initiate_return` — read-only)
```json
{
  "type": "function",
  "function": {
    "name": "get_return_info",
    "description": "Tra cứu yêu cầu đổi/trả hiện có và điều kiện đổi trả của user đang đăng nhập. Không tạo yêu cầu mới — hướng user sang /returns.",
    "parameters": {
      "type": "object",
      "properties": {
        "orderId": { "type": "string" },
        "reason": { "type": "string" }
      },
      "required": ["orderId", "reason"]
    }
  }
}
```

> ⚠️ **Nguyên tắc bắt buộc:** Không tool nào có tham số `userId`. `userId` luôn được `ToolDispatcher` inject từ `SecurityContextHolder`, không bao giờ tin tưởng giá trị do model sinh ra.

---

## 4. Cấu trúc thư mục Java đề xuất

```
src/main/java/com/yourapp/ai/
├── controller/
│   └── AiChatController.java
├── service/
│   ├── AiOrchestratorService.java
│   ├── ToolDispatcher.java
│   └── OpenAiClient.java
├── tool/
│   ├── ToolDefinition.java
│   ├── CatalogSearchTool.java
│   ├── PolicyTool.java
│   ├── OrderStatusTool.java
│   └── InitiateReturnTool.java
├── dto/
│   ├── ChatRequest.java
│   ├── ChatResponse.java          // answer, suggestedProducts, warnings
│   ├── ToolCallResult.java
│   └── ConversationMessage.java
└── config/
    └── OpenAiConfig.java          // apiKey, model, timeout từ application.yml
```

---

## 5. Chi tiết implementation từng phần

### 5.1. `OpenAiConfig`

```java
@Configuration
public class OpenAiConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    @Bean
    public WebClient openAiWebClient() {
        return WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .build();
    }
}
```

`application.yml` / `.env`:
```yaml
openai:
  api-key: ${OPENAI_API_KEY}
  model: gpt-4o-mini
  max-tool-loop: 4
  structured-output-model: gpt-4o-mini
  vision-model: gpt-4o
  timeout-ms: 30000

ai.image.webp-quality: 85
ai.image.max-input-bytes: 10485760
ai.image.max-dimension: 4096

rate-limit.ai-chat-max: 30
rate-limit.ai-voice-max: 10
rate-limit.ai-image-max: 10
```

Map từ `.env`: `OPENAI_MAX_TOOL_LOOP`, `OPENAI_VISION_MODEL`, `AI_IMAGE_WEBP_QUALITY`, `RATE_LIMIT_AI_*` — xem `.env.example`.

> Không hardcode API key, luôn đọc từ biến môi trường (giống cách bạn đang xử lý SePay key qua env).

---

### 5.2. `AiChatController`

```java
@RestController
@RequestMapping("/ai")
public class AiChatController {

    private final AiOrchestratorService orchestratorService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody @Valid ChatRequestDto request,
            @AuthenticationPrincipal(errorOnInvalidType = false) UserPrincipal principal
    ) {
        String userId = principal != null ? principal.getId() : null; // null = Guest
        ChatResponse response = orchestratorService.handle(request, userId);
        return ResponseEntity.ok(response);
    }
}
```

- Nếu `principal == null` → xử lý như Guest: vẫn cho `search_catalog` và `get_policy`, nhưng chặn `get_order_status`/`initiate_return` **ở tầng orchestrator**, không đợi model tự chối.

---

### 5.3. `AiOrchestratorService` (phần lõi)

```java
@Service
@RequiredArgsConstructor
public class AiOrchestratorService {

    private final OpenAiClient openAiClient;
    private final ToolDispatcher toolDispatcher;
    private final ConversationHistoryService historyService; // đọc/ghi Redis

    @Value("${openai.max-tool-loop:4}")
    private int maxToolLoop;

    public ChatResponse handle(ChatRequestDto request, String userId) {
        List<Message> messages = new ArrayList<>();
        messages.add(Message.system(buildSystemPrompt(userId)));
        messages.addAll(historyService.getHistory(request.getConversationId()));
        messages.add(Message.user(request.getMessage()));

        List<ToolDefinition> availableTools = resolveToolsForUser(userId);

        int loopCount = 0;
        OpenAiChatResult result = openAiClient.chat(messages, availableTools);

        while (result.hasToolCalls() && loopCount < maxToolLoop) {
            for (ToolCall call : result.getToolCalls()) {
                Object toolResult = toolDispatcher.dispatch(call.getName(), call.getArguments(), userId);
                messages.add(Message.toolResult(call.getId(), toolResult));
            }
            result = openAiClient.chat(messages, availableTools);
            loopCount++;
        }

        historyService.appendHistory(request.getConversationId(), messages);
        return result.getStructuredResponse(); // đã parse theo JSON Schema, xem mục 6
    }

    private List<ToolDefinition> resolveToolsForUser(String userId) {
        List<ToolDefinition> tools = new ArrayList<>(List.of(
                CatalogSearchTool.DEFINITION,
                PolicyTool.DEFINITION
        ));
        if (userId != null) {
            tools.add(OrderStatusTool.DEFINITION);
            tools.add(InitiateReturnTool.DEFINITION);
        }
        return tools;
    }
}
```

> **Quan trọng:** Với Guest, tool `get_order_status`/`initiate_return` **không được đưa vào danh sách tools gửi lên OpenAI**. Đây là cách chặn chắc chắn nhất — model không thể gọi tool nó không hề biết tồn tại. Đồng thời vẫn nên trả `warnings: ["Đăng nhập để xem đơn"]` nếu model tự nhận ra intent liên quan tới đơn hàng.

---

### 5.4. `ToolDispatcher`

```java
@Service
@RequiredArgsConstructor
public class ToolDispatcher {

    private final CatalogService catalogService;
    private final PolicyService policyService;
    private final OrderService orderService;
    private final ReturnService returnService;

    public Object dispatch(String toolName, Map<String, Object> args, String userId) {
        return switch (toolName) {
            case "search_catalog" -> catalogService.search(
                    (String) args.get("query"),
                    (String) args.get("size"),
                    (String) args.get("color"),
                    toDouble(args.get("minPrice")),
                    toDouble(args.get("maxPrice")),
                    (String) args.get("category")
            );
            case "get_policy" -> policyService.getPolicy((String) args.get("topic"));
            case "get_order_status" -> {
                requireLogin(userId);
                yield orderService.mine(userId, (String) args.get("orderId"));
            }
            case "initiate_return" -> {
                requireLogin(userId);
                yield returnService.initiate(userId,
                        (String) args.get("orderId"),
                        (String) args.get("reason"));
            }
            default -> throw new IllegalArgumentException("Unknown tool: " + toolName);
        };
    }

    private void requireLogin(String userId) {
        if (userId == null) {
            throw new AccessDeniedException("Yêu cầu đăng nhập để sử dụng tool này");
        }
    }
}
```

---

## 6. Structured Output cho response cuối

Dùng `response_format: { type: "json_schema", json_schema: {...}, strict: true }` khi gọi model ở bước tổng hợp câu trả lời cuối (không phải bước có tool_calls).

Schema:
```json
{
  "name": "chat_response",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "answer": { "type": "string" },
      "suggestedProducts": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "price": { "type": "number" },
            "imageUrl": { "type": "string" }
          },
          "required": ["id", "name", "price", "imageUrl"]
        }
      },
      "warnings": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["answer", "suggestedProducts", "warnings"]
  }
}
```

DTO Java tương ứng, dùng Jackson để deserialize trực tiếp:
```java
public record ChatResponse(
        String answer,
        List<SuggestedProduct> suggestedProducts,
        List<String> warnings
) {}

public record SuggestedProduct(String id, String name, BigDecimal price, String imageUrl) {}
```

---

## 7. Tối ưu tìm kiếm CATALOG (MongoDB hiện có)

Bạn đang dùng `$text` index trên `name`, `shortDescription`, `description`. Cải tiến:

1. **Lọc cứng trước, full-text sau** — dùng `Criteria` filter theo `size`, `color`, `price` (nếu có) trước khi áp `$text`, giảm tập dữ liệu cần match:

```java
Query query = new Query();
if (size != null) query.addCriteria(Criteria.where("variants.size").is(size));
if (color != null) query.addCriteria(Criteria.where("color").is(color));
if (minPrice != null || maxPrice != null) {
    Criteria priceCriteria = Criteria.where("price");
    if (minPrice != null) priceCriteria = priceCriteria.gte(minPrice);
    if (maxPrice != null) priceCriteria = priceCriteria.lte(maxPrice);
    query.addCriteria(priceCriteria);
}
if (StringUtils.hasText(searchQuery)) {
    query.addCriteria(TextCriteria.forDefaultLanguage().matching(searchQuery));
    query.with(Sort.by(Sort.Direction.DESC, "score").and(Sort.by("_id")));
}
query.limit(10);
```

2. **Giai đoạn sau (không bắt buộc ngay):** cân nhắc MongoDB Atlas Vector Search nếu muốn semantic search thật (tìm theo ý nghĩa thay vì khớp từ khóa) — không cần đổi DB, chỉ cần bật tính năng trên Atlas cluster.

---

## 8. Redis: lưu lịch sử hội thoại

```java
@Service
@RequiredArgsConstructor
public class ConversationHistoryService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final Duration TTL = Duration.ofMinutes(30);

    public List<Message> getHistory(String conversationId) {
        String json = redisTemplate.opsForValue().get("chat:history:" + conversationId);
        if (json == null) return new ArrayList<>();
        return objectMapper.readValue(json, new TypeReference<List<Message>>() {});
    }

    public void appendHistory(String conversationId, List<Message> messages) {
        // Giới hạn số lượng message giữ lại (ví dụ 20 message gần nhất) để tránh phình token
        List<Message> trimmed = trimToLast(messages, 20);
        String json = objectMapper.writeValueAsString(trimmed);
        redisTemplate.opsForValue().set("chat:history:" + conversationId, json, TTL);
    }
}
```

Đồng thời cache kết quả `get_policy` (nội dung `policies.yml` ít đổi):
```java
@Cacheable(value = "policyCache", key = "#topic")
public String getPolicy(String topic) { ... }
```

---

## 9. Bảo mật — checklist bắt buộc

| # | Yêu cầu | Cách thực hiện |
|---|---|---|
| 1 | Không để model tự chọn `userId`/`orderId` của người khác | `userId` luôn lấy từ `SecurityContextHolder`, không nhận từ tool argument |
| 2 | Guest không gọi được `get_order_status`/`initiate_return` | Không đưa 2 tool này vào danh sách `tools` gửi cho model khi `userId == null` |
| 3 | Chặn prompt injection từ nội dung sản phẩm/policy trả về | Luôn coi tool result là **data**, không cho phép model "thực thi" instruction nằm trong đó — không nhúng tool result trực tiếp vào system prompt |
| 4 | Giới hạn vòng lặp tool | `max-tool-loop` (mục 5.3) để tránh lạm dụng token / loop vô hạn |
| 5 | Rate limit endpoint `/ai/chat` | Dùng Spring bucket4j hoặc Redis-based rate limiter theo `userId`/IP |
| 6 | Không log nội dung nhạy cảm (đơn hàng, địa chỉ) ra log thường | Mask dữ liệu trước khi log |

---

## 10. Kế hoạch triển khai theo giai đoạn

- [x] **Giai đoạn 1 — Nền tảng:** `OpenAiConfig`, `OpenAiClient` (`/v1/chat/completions`), DTO.
- [x] **Giai đoạn 2 — Tool hoá:** 4 tools + `ToolDispatcher`, `AiOrchestratorService`; `AiChatService` delegate orchestrator.
- [x] **Giai đoạn 3 — Structured Output:** `response_format: json_schema` → `AiChatResponse`.
- [x] **Giai đoạn 4 — Redis history + cache policy:** Guest Redis TTL 30 phút; login MongoDB; `@Cacheable` policy.
- [x] **Giai đoạn 5 — Bảo mật:** rate limit `/ai/*`, guest tool whitelist, unit tests.
- [x] **Giai đoạn 6 — Voice:** `WhisperClient`, `POST /ai/chat/voice`, mic trên FE.
- [x] **Giai đoạn 7 — Visual search:** WebP normalize, Cloudinary, Vision, `POST /ai/chat/image`, upload ảnh trên FE.
- [x] **Giai đoạn 8 — Visual search chính xác:** `gpt-4o` vision structured output (`VisionAnalysis`), `ImageSearchService` + relevance filter, image search mode trong orchestrator, FE `AiChatComposer` (preview + caption), menu header **Trợ lý AI**.
- [x] **Giai đoạn 9 — Voice quality:** Whisper `verbose_json` + hallucination filter, domain vocab `prompt`, `TranscriptNormalizerService`, `VoiceTranscriptService`, FE min recording 800ms.

**Legacy (không còn dùng trong luồng chat, có thể xóa sau):** `AiRouterService`, `AiContextBuilder`, `OpenAiChatAdapter`. Embedding index (`AiRetrievalService`) vẫn tồn tại cho index startup nhưng catalog search trong chat đi qua tool `search_catalog`.

---

## 11. Voice Input (Whisper + ASR Pipeline)

Cho phép user hỏi bằng giọng nói. Pipeline gồm **3 lớp phòng thủ bổ trợ nhau** (hallucination filter ≠ ASR normalization):

```
FE (MediaRecorder, MIN_RECORDING_MS ≥ 800)
   │  POST /ai/chat/voice
   ▼
VoiceTranscriptService
   ├─ 1. WhisperClient (whisper-1, language=vi, temperature=0, prompt=domain vocab)
   ├─ 2. WhisperTranscriptFilter (verbose_json segments: no_speech_prob, avg_logprob, blacklist)
   └─ 3. TranscriptNormalizerService (gpt-4o-mini, temperature=0, structured JSON)
   ▼
AiOrchestratorService.handle(transcript, userId)   // luồng text bình thường
```

### 11.1. Lớp 1 — Client: chặn audio rỗng/quá ngắn

`fe/src/utils/audioRecording.ts`:

```ts
export const MIN_RECORDING_MS = 800;

export function isRecordingTooShort(durationMs: number): boolean {
  return durationMs < MIN_RECORDING_MS;
}
```

`AiChatPage` / `FloatingChatbot`: đo thời gian ghi âm → nếu < 800ms thì không gọi API.

### 11.2. Lớp 2 — Whisper + lọc hallucination

**Domain vocab bias** (`WhisperClient.DOMAIN_VOCAB_HINT`):

```text
Giày thể thao, giày chạy bộ, giày bóng rổ, sneaker, sandal, dép, size,
Nike, Adidas, Puma, Converse, Vans, New Balance, đổi trả, bảo hành, size 39 40 41 42 43 44.
```

Gửi qua tham số `prompt` — gợi ý vocabulary, giúp Whisper chọn đúng từ khi phát âm mơ hồ (*"bóng rục"* → ít xảy ra hơn).

**Request Whisper:**

| Param | Giá trị |
|-------|---------|
| `model` | `whisper-1` |
| `language` | `vi` |
| `response_format` | `verbose_json` |
| `temperature` | `0` |
| `prompt` | `DOMAIN_VOCAB_HINT` |

**`WhisperTranscriptFilter`** — lọc từng segment:

| Rule | Ngưỡng |
|------|--------|
| `no_speech_prob` | Bỏ segment ≥ **0.6** (coi như im lặng/nhiễu) |
| `avg_logprob` | Bỏ segment ≤ **-1.0** (model không tự tin) |
| Blacklist regex | *"đăng ký kênh"*, *"subscribe"*, *"like and share"*, *"không bỏ lỡ video"*… |

Nếu **tất cả segment bị loại** → transcript rỗng → `400`:

```text
Không nghe rõ, bạn vui lòng nói lại gần micro hơn nhé.
```

> **Lưu ý:** Đây là hiện tượng hallucination nổi tiếng của Whisper (train trên YouTube) — không phải lỗi audio client. Lọc `no_speech_prob` hiệu quả hơn chỉ dùng blacklist.

### 11.3. Lớp 3 — `TranscriptNormalizerService` (ASR error correction)

Sửa lỗi nghe nhầm domain-specific **sau** Whisper, **trước** orchestrator.

- Model: `gpt-4o-mini`, `temperature: 0`
- Structured output: `{ correctedText, corrections: [{ from, to }] }`
- Chỉ sửa lỗi ASR **rõ ràng** — không diễn giải lại, không đoán ý

**Safety guard over-correct:**

```java
if (corrections.size() > wordCount(raw) * 0.4) {
    return rawTranscript; // nghi ngờ model đang paraphrase, không tin
}
```

**Ví dụ:**

| Raw (Whisper) | Corrected | corrections |
|---------------|-----------|-------------|
| `tìm giày bóng rục size 42` | `tìm giày bóng rổ size 42` | `[{from:"bóng rục", to:"bóng rổ"}]` |

API lỗi / thiếu `OPENAI_API_KEY` → giữ nguyên raw transcript.

### 11.4. `VoiceTranscriptService`

Gom pipeline voice — `AiChatController` gọi:

```java
String transcript = voiceTranscriptService.processToText(audioFile);
```

### 11.5. Endpoint

```java
@PostMapping(value = "/chat/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ApiResponse<AiChatResponse>> chatByVoice(
        @RequestParam("audio") MultipartFile audioFile,
        @RequestParam(value = "conversationId", required = false) String conversationId,
        Authentication authentication) {
    String transcript = voiceTranscriptService.processToText(audioFile);
    // ... orchestrator, trả kèm transcript trong response
}
```

### 11.6. Checklist voice

| # | Yêu cầu | Trạng thái |
|---|---------|------------|
| 1 | Validate magic bytes audio, ≤10MB | ✅ `AiAudioValidator` |
| 2 | `language: vi`, `temperature: 0` | ✅ |
| 3 | Domain vocab `prompt` | ✅ |
| 4 | `verbose_json` + lọc segment | ✅ `WhisperTranscriptFilter` |
| 5 | Blacklist hallucination YouTube | ✅ |
| 6 | ASR normalization (`TranscriptNormalizerService`) | ✅ |
| 7 | Over-correct guard (>40% từ) | ✅ |
| 8 | FE `MIN_RECORDING_MS=800` | ✅ |
| 9 | Rate limit `/ai/chat/voice` (10/15 phút/IP) | ✅ |

### 11.7. Frontend

- `AiChatComposer`: menu `+` → Ghi âm
- `getSupportedAudioFormat()` — WebM/MP4/OGG tùy browser
- Optimistic UI: bubble *"🎤 Đang xử lý..."* → cập nhật transcript khi có response
- Lỗi voice: xóa bubble tạm + thông báo *"Không nghe rõ..."*

---

## 12. Visual/Image Search (GPT-4o Vision + ImageSearchService)

Cho phép user gửi ảnh (chụp ngoài đường, screenshot mạng xã hội) để tìm giày trong catalog SOLE.

> **Lưu ý kiến trúc:** Đây **không phải** visual similarity search (so sánh pixel/embedding ảnh). Luồng là: **Vision mô tả ảnh có cấu trúc → tìm text trong MongoDB → lọc relevance theo brand/model**. Từ giai đoạn 8, backend **không** để LLM tự gọi `search_catalog` rộng khi user gửi ảnh — tránh gợi ý Samba/AF1 khi ảnh là MLB Chunky không có trong shop.

### 12.1. Luồng xử lý (giai đoạn 8)

```
React Client (AiChatComposer: chọn ảnh → preview + caption tùy chọn → gửi)
   │  POST /ai/chat/image  (multipart: image, conversationId?, message?)
   ▼
AiChatController.chatByImage()
   │  1. AiImageValidator — magic bytes, ≤10MB
   │  2. ImageNormalizer — WebP, resize max 4096px (WebP pass-through nếu Java 17 không đọc được plugin)
   │  3. Cloudinary upload → folder ai-search-temp
   │  4. VisionClient.analyzeImage() — gpt-4o, JSON schema → VisionAnalysis
   │  5. ImageSearchService.resolve(vision) — tìm catalog + lọc relevance
   ▼
AiOrchestratorService.handle(..., ImageSearchContext)   ← chế độ image search
   │  - KHÔNG gọi tool search_catalog (tránh broad search)
   │  - System prompt imageSearchPrompt: khớp → gợi ý SP; không khớp → answer thật + suggestedProducts=[]
   │  - Structured Output → answer + warnings
   ▼
Response { answer, suggestedProducts[], warnings[], sourceImageUrl }
```

### 12.2. `VisionAnalysis` (structured output từ GPT-4o)

Model vision (`OPENAI_VISION_MODEL`, mặc định `gpt-4o`) trả JSON strict schema:

| Field | Mô tả |
|-------|--------|
| `brand` | Thương hiệu nếu nhìn thấy logo/chữ (MLB, Nike…); `""` nếu không chắc |
| `model` | Tên model (Chunky Liner, Air Force 1…); `""` nếu không chắc |
| `color`, `style`, `category` | Mô tả ngắn |
| `description` | 1–2 câu tiếng Việt mô tả đôi giày |
| `searchQuery` | Từ khóa tìm catalog — ưu tiên `brand + model`, không thêm từ chung như "sneaker" khi đã có brand |
| `brandIdentified` | `true` chỉ khi chắc chắn thương hiệu |

File: `be/.../ai/dto/VisionAnalysis.java`, gọi qua `OpenAiClient.analyzeImage()`.

### 12.3. `ImageSearchService` + `ImageSearchMatcher`

**Tìm kiếm:**
1. Query catalog với `vision.primarySearchQuery()` (vd. `"MLB Chunky Liner"`).
2. `ImageSearchMatcher.filterExactMatches()` — chỉ giữ SP khi:
   - Nếu `brandIdentified=true` → tên SP hoặc `brandName` phải chứa brand.
   - Nếu có `model` → ít nhất 2 token model (hoặc 1 token nếu model ngắn) phải xuất hiện trong tên/brand.

**Quyết định `exactMatch`:**
| Tình huống | `exactMatch` | `suggestedProducts` |
|------------|--------------|---------------------|
| Có SP khớp brand + model | `true` | Danh sách khớp |
| `brandIdentified=true` nhưng không SP khớp (vd. MLB Chunky không có trong DB) | `false` | `[]` |
| Không nhận ra brand, chỉ style/màu | `false` | `[]` (không gợi ý “tương tự” như kết quả tìm ảnh) |

**Warning tự động** khi không khớp: `"SOLE hiện chưa có MLB Chunky Liner trong catalog."`

### 12.4. Orchestrator — image search mode

Khi `ImageSearchContext != null`:

- Thêm `AiPromptTemplates.imageSearchPrompt(imageSearch)` vào messages.
- **Không** đưa `search_catalog` vào tools (`resolveToolsWithoutCatalog`) — chỉ `get_policy` (+ order/return nếu login).
- **Bỏ qua** vòng lặp tool_calls; đi thẳng Structured Output.
- Sau response: `applyImageSearchProducts()` — force `suggestedProducts` từ kết quả đã lọc (hoặc `[]` nếu không khớp).

Prompt khi **không khớp** bắt buộc model:
- Nói rõ shop chưa có mẫu đó.
- **KHÔNG** nói "phù hợp" / liệt kê Samba, AF1…
- `suggestedProducts` phải rỗng.

### 12.5. Endpoint

```java
@PostMapping(value = "/chat/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ApiResponse<AiChatResponse>> chatByImage(
        @RequestParam("image") MultipartFile imageFile,
        @RequestParam(value = "conversationId", required = false) String conversationId,
        @RequestParam(value = "message", required = false) String userMessage,  // caption tùy chọn
        Authentication authentication) {
    // validate → normalize → Cloudinary
    VisionAnalysis analysis = visionClient.analyzeImage(cloudinaryUrl);
    ImageSearchContext imageSearch = imageSearchService.resolve(analysis);
    // prompt: caption + mô tả ảnh hoặc "Tìm giày giống ảnh này: {brand model}"
    return aiChatService.chatByImage(userId, request, cloudinaryUrl, imageSearch);
}
```

**Multipart fields:**

| Field | Bắt buộc | Mô tả |
|-------|----------|--------|
| `image` | ✅ | JPEG/PNG/WebP/HEIC/GIF/BMP/TIFF, ≤10MB |
| `conversationId` | ❌ | Tiếp tục hội thoại |
| `message` | ❌ | Caption kèm ảnh (vd. "size 42", "màu trắng") |

### 12.6. Cấu hình vision

```yaml
openai:
  vision-model: gpt-4o   # OPENAI_VISION_MODEL — riêng với OPENAI_MODEL (chat text)
```

Chat text / structured output vẫn dùng `gpt-4o-mini` (tiết kiệm chi phí). Chỉ bước phân tích ảnh dùng `gpt-4o`.

### 12.7. Frontend (`AiChatComposer`)

| Hành vi | Chi tiết |
|---------|----------|
| Nút `+` | Popover: Chọn ảnh / Ghi âm (thay icon riêng lẻ) |
| Preview ảnh | Hiện thumbnail + ô caption trước khi gửi |
| Optimistic UI | Bubble user hiện ngay khi bấm gửi (không đợi API) |
| Clear preview | Xóa preview ngay khi gửi (không đợi response) |
| Timeout | `AI_API_TIMEOUT_MS=120s` cho endpoint ảnh |
| Menu header | `publicNavigation`: **Trợ lý AI** → `/ai-chat` (thay mục Đánh giá) |

```ts
// fe/src/services/ecommerceServices.ts
aiApi.chatImage(file, conversationId?, message?)
```

### 12.8. Ví dụ: ảnh MLB Chunky không có trong catalog

**Input:** User gửi ảnh giày MLB Chunky Liner.

**Vision (`gpt-4o`):**
```json
{
  "brand": "MLB",
  "model": "Chunky Liner",
  "color": "trắng",
  "style": "chunky sneaker",
  "description": "Giày MLB Chunky Liner màu trắng, đế dày",
  "searchQuery": "MLB Chunky Liner",
  "brandIdentified": true
}
```

**ImageSearchService:** Catalog không có MLB → `exactMatch=false`, `products=[]`.

**Response mẫu:**
```json
{
  "answer": "SOLE hiện chưa có MLB Chunky Liner trong catalog. Bạn có thể xem thêm tại /products hoặc thử tìm thương hiệu khác nhé!",
  "suggestedProducts": [],
  "warnings": ["SOLE hiện chưa có MLB Chunky Liner trong catalog."],
  "sourceImageUrl": "https://res.cloudinary.com/.../ai-search-temp/....webp"
}
```

**Trước giai đoạn 8 (lỗi):** LLM gọi `search_catalog({query: "sneaker trắng"})` → trả Samba, Air Max, AF1 và nói "phù hợp với mô tả".

### 12.9. Checklist riêng cho visual search

| # | Yêu cầu | Trạng thái |
|---|---------|------------|
| 1 | Validate magic bytes, ≤10MB | ✅ `AiImageValidator` |
| 2 | Normalize WebP, resize 4096px | ✅ `ImageNormalizer` + `ImageIoConfig` |
| 3 | Cloudinary folder `ai-search-temp` | ✅ |
| 4 | Vision model `gpt-4o` + structured `VisionAnalysis` | ✅ `OPENAI_VISION_MODEL` |
| 5 | Relevance filter brand/model | ✅ `ImageSearchMatcher` |
| 6 | Không gợi ý SP sai khi không khớp | ✅ image search mode orchestrator |
| 7 | Rate limit `/ai/chat/image` (10/15 phút/IP) | ✅ |
| 8 | Caption tùy chọn (`message`) | ✅ |
| 9 | FE preview + optimistic send | ✅ `AiChatComposer` |

### 12.10. Hạn chế & hướng cải thiện sau

| Hạn chế hiện tại | Hướng xử lý |
|------------------|-------------|
| Không so sánh ảnh SP trong catalog | CLIP / image embedding + vector search |
| Text search MongoDB không semantic | Atlas Vector Search hoặc embedding product |
| Java 17: plugin WebP/HEIC nightmonkeys cần Java 21 | WebP pass-through lên Cloudinary vẫn hoạt động |
| Chỉ khớp theo tên/brand text | Bổ sung tag `brand`, `model`, `style` vào catalog |

---

## 12-legacy. (Tham khảo) Luồng visual search cũ — đã thay thế

Luồng cũ (giai đoạn 7): Vision mô tả text tự do → orchestrator → LLM tự gọi `search_catalog` → dễ trả SP không liên quan. **Không còn dùng** từ giai đoạn 8.

<details>
<summary>Code tham khảo luồng cũ</summary>

```java
// CŨ — Vision trả text, LLM tự search rộng
String description = visionClient.describeImage(cloudinaryUrl);
String prompt = "Tìm giày giống ảnh này: " + description;
orchestratorService.handle(request, userId); // có search_catalog tool
```

</details>

---

## 13. Test cần có

1. **Unit test `ToolDispatcher`:** Guest gọi `get_order_status` → phải throw `AccessDeniedException`.
2. **Unit test `AiOrchestratorService`:** đảm bảo Guest không nhận được tool `initiate_return` trong danh sách gửi lên OpenAI (mock `OpenAiClient`, assert tools list).
3. **Integration test `/ai/chat`:** với mock OpenAI response có `tool_calls`, verify đúng service được gọi (`CatalogService.search`, `OrderService.mine`...).
4. **Test giới hạn loop:** mock OpenAI luôn trả `tool_calls` → đảm bảo dừng đúng sau `maxToolLoop` lần, không loop vô hạn.
5. **Test schema response:** đảm bảo JSON trả về luôn parse được vào `ChatResponse`, kể cả khi `suggestedProducts` rỗng.
6. **Test `ImageSearchMatcher`:** brand MLB + model Chunky → reject Adidas Samba, Nike AF1.
7. **Test `ImageSearchService`:** `brandIdentified=true`, catalog rỗng → `exactMatch=false`, `products=[]`.
8. **Test orchestrator image mode:** không gọi `search_catalog` khi có `ImageSearchContext`.
9. **Test `WhisperTranscriptFilter`:** lọc `no_speech_prob` cao, blacklist YouTube outro.
10. **Test `TranscriptNormalizerService`:** guard over-correct >40% từ.
11. **Test `AiAudioValidator`:** magic bytes WebM/WAV.

---

## 14. Ví dụ luồng thực tế

**User (đã login):** *"Đơn của tôi giao chưa, với lại có giày Nike size 42 không?"*

1. Orchestrator gửi message + tools (`search_catalog`, `get_policy`, `get_order_status`, `initiate_return`) lên OpenAI.
2. Model trả về **2 tool_calls**: `get_order_status({})` và `search_catalog({query: "Nike", size: "42"})`.
3. `ToolDispatcher` gọi `OrderService.mine(userId, null)` và `CatalogService.search(...)`.
4. Kết quả tool được gửi lại OpenAI.
5. Model tổng hợp câu trả lời cuối theo JSON Schema, trả về:
```json
{
  "answer": "Đơn hàng #A123 của bạn đang giao, dự kiến 2 ngày nữa. Ngoài ra shop có 3 mẫu Nike size 42 phù hợp.",
  "suggestedProducts": [ { "id": "...", "name": "Nike Air ...", "price": 2100000, "imageUrl": "..." } ],
  "warnings": []
}
```
