# AI SHOPPING COPILOT — STACK CHÍNH THỨC

## Tech Stack

```text
Backend
├── Java 17
├── Spring Boot
├── Spring Web
├── Spring Security
├── Spring Data MongoDB
├── Bean Validation
└── WebClient / OpenAI Java SDK

Database
└── MongoDB
    ├── Product catalog
    ├── Full-text search
    ├── AI conversations
    ├── User preferences
    ├── Foot profiles
    ├── Fit histories
    └── Embeddings / semantic search

Frontend
├── React 19
├── TypeScript
├── TanStack Query
└── Axios / Fetch

AI
├── OpenAI Responses API
├── Function / Tool Calling
├── Embeddings
├── Vision
├── Image Generation
└── Realtime API
```

---

# 1. Kiến trúc Backend mới

```text
React 19
   │
   │ POST /api/v1/ai/chat
   ▼
AiChatController
   │
   ▼
AiAgentService
   │
   ▼
OpenAiClient
   │
   │ Tool Calls
   ▼
AiToolExecutor
   │
   ├── ProductSearchTool
   ├── ProductDetailTool
   ├── ProductVariantTool
   ├── SizeAdvisorTool
   ├── ProductCompareTool
   ├── OrderTool
   ├── ReturnTool
   ├── CouponTool
   └── CartTool
          │
          ▼
   Spring Services
          │
          ▼
     MongoRepository
          │
          ▼
        MongoDB
```

Nguyên tắc:

```text
OpenAI
    ↓
chọn tool

Spring Boot
    ↓
execute business logic

MongoDB
    ↓
source of truth

OpenAI
    ↓
giải thích

React
    ↓
render UI
```

---

# 2. Package structure

Đề xuất:

```text
src/main/java/com/shoecommerce/
│
├── ai/
│   │
│   ├── controller/
│   │   └── AiChatController.java
│   │
│   ├── agent/
│   │   ├── AiAgentService.java
│   │   ├── AiToolExecutor.java
│   │   ├── AiToolRegistry.java
│   │   └── AiResponseBuilder.java
│   │
│   ├── openai/
│   │   ├── OpenAiClient.java
│   │   ├── OpenAiProperties.java
│   │   └── OpenAiConfiguration.java
│   │
│   ├── tool/
│   │   │
│   │   ├── product/
│   │   │   ├── SearchProductsTool.java
│   │   │   ├── GetProductTool.java
│   │   │   ├── GetProductVariantsTool.java
│   │   │   └── CompareProductsTool.java
│   │   │
│   │   ├── size/
│   │   │   ├── GetFootProfileTool.java
│   │   │   └── RecommendSizeTool.java
│   │   │
│   │   ├── user/
│   │   │   ├── GetOrdersTool.java
│   │   │   ├── GetReturnsTool.java
│   │   │   └── GetPreferencesTool.java
│   │   │
│   │   └── commerce/
│   │       ├── GetCouponsTool.java
│   │       ├── AddToCartTool.java
│   │       └── WishlistTool.java
│   │
│   ├── search/
│   │   ├── ProductSearchService.java
│   │   ├── SemanticSearchService.java
│   │   ├── HybridSearchService.java
│   │   ├── EmbeddingService.java
│   │   └── ProductSearchDocumentBuilder.java
│   │
│   ├── size/
│   │   ├── SizeAdvisorService.java
│   │   └── FitHistoryService.java
│   │
│   ├── personalization/
│   │   ├── UserPreferenceService.java
│   │   └── PersonalizationService.java
│   │
│   ├── vision/
│   │   ├── ImageAnalysisService.java
│   │   └── VisualSearchService.java
│   │
│   ├── compare/
│   │   └── ProductCompareService.java
│   │
│   ├── stylist/
│   │   └── OutfitStylistService.java
│   │
│   ├── conversation/
│   │   ├── AiConversationService.java
│   │   └── AiMessageService.java
│   │
│   ├── document/
│   │   ├── AiConversation.java
│   │   ├── AiMessage.java
│   │   ├── AiProductEmbedding.java
│   │   ├── UserFootProfile.java
│   │   ├── UserFitHistory.java
│   │   └── AiUserPreference.java
│   │
│   ├── repository/
│   │   ├── AiConversationRepository.java
│   │   ├── AiMessageRepository.java
│   │   ├── AiProductEmbeddingRepository.java
│   │   ├── UserFootProfileRepository.java
│   │   └── UserFitHistoryRepository.java
│   │
│   └── dto/
│       ├── AiChatRequest.java
│       ├── AiChatResponse.java
│       ├── AiToolResult.java
│       └── ui/
│
├── product/
├── order/
├── returnrequest/
├── cart/
├── inventory/
├── promotion/
└── security/
```

Không nên đặt toàn bộ logic vào:

```text
AiService.java
```

vì sau này class này sẽ cực lớn.

---

# 3. Spring Controller

```java
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiAgentService aiAgentService;

    @PostMapping("/chat")
    public AiChatResponse chat(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody AiChatRequest request
    ) {

        AiRequestContext context =
                AiRequestContext.builder()
                        .userId(
                            principal != null
                                ? principal.getId()
                                : null
                        )
                        .authenticated(principal != null)
                        .build();

        return aiAgentService.chat(
                context,
                request
        );
    }
}
```

Request:

```java
public record AiChatRequest(

    String conversationId,

    @NotBlank
    String message

) {}
```

---

# 4. AiAgentService

Đây là trung tâm orchestration.

```java
@Service
@RequiredArgsConstructor
public class AiAgentService {

    private final OpenAiClient openAiClient;

    private final AiToolExecutor toolExecutor;

    private final AiConversationService conversationService;

    private final AiResponseBuilder responseBuilder;

    public AiChatResponse chat(
            AiRequestContext context,
            AiChatRequest request
    ) {

        var conversation =
                conversationService.getOrCreate(
                        context,
                        request.conversationId()
                );

        var history =
                conversationService.getRecentMessages(
                        conversation.getId(),
                        8
                );

        var response =
                openAiClient.createResponse(
                        history,
                        request.message()
                );

        int toolRounds = 0;

        while (
                response.hasToolCalls()
                && toolRounds < 5
        ) {

            var toolResults =
                    toolExecutor.executeAll(
                            response.getToolCalls(),
                            context
                    );

            response =
                    openAiClient.continueResponse(
                            response,
                            toolResults
                    );

            toolRounds++;
        }

        return responseBuilder.build(response);
    }
}
```

Đây chính là phần thay thế:

```text
AiRouterService.route(message)
```

---

# 5. Tool interface

Có thể tạo abstraction chung:

```java
public interface AiTool<I, O> {

    String getName();

    Class<I> getInputType();

    O execute(
        I input,
        AiRequestContext context
    );
}
```

Ví dụ:

```java
@Component
@RequiredArgsConstructor
public class SearchProductsTool
        implements AiTool<
            SearchProductsInput,
            SearchProductsResult
        > {

    private final HybridSearchService hybridSearchService;

    @Override
    public String getName() {
        return "search_products";
    }

    @Override
    public Class<SearchProductsInput> getInputType() {
        return SearchProductsInput.class;
    }

    @Override
    public SearchProductsResult execute(
            SearchProductsInput input,
            AiRequestContext context
    ) {

        return hybridSearchService.search(input);
    }
}
```

---

# 6. Tool Registry

```java
@Component
public class AiToolRegistry {

    private final Map<String, AiTool<?, ?>> tools;

    public AiToolRegistry(
            List<AiTool<?, ?>> toolList
    ) {

        this.tools =
                toolList.stream()
                        .collect(
                            Collectors.toMap(
                                AiTool::getName,
                                Function.identity()
                            )
                        );
    }

    public AiTool<?, ?> get(String name) {

        var tool = tools.get(name);

        if (tool == null) {
            throw new IllegalArgumentException(
                "Unknown AI tool: " + name
            );
        }

        return tool;
    }
}
```

Lợi ích của Spring DI:

```text
@Component SearchProductsTool
@Component SizeAdvisorTool
@Component OrderTool
...

        ↓

Spring inject List<AiTool>

        ↓

Tool Registry tự discover
```

Không cần một switch khổng lồ.

---

# 7. Tool Executor

```java
@Service
@RequiredArgsConstructor
public class AiToolExecutor {

    private final AiToolRegistry registry;

    private final ObjectMapper objectMapper;

    public AiToolResult execute(
            AiToolCall call,
            AiRequestContext context
    ) {

        AiTool<?, ?> rawTool =
                registry.get(call.name());

        return executeInternal(
                rawTool,
                call,
                context
        );
    }

    private <I, O> AiToolResult executeInternal(
            AiTool<I, O> tool,
            AiToolCall call,
            AiRequestContext context
    ) {

        I input =
                objectMapper.convertValue(
                        call.arguments(),
                        tool.getInputType()
                );

        O result =
                tool.execute(
                        input,
                        context
                );

        return new AiToolResult(
                call.id(),
                tool.getName(),
                result
        );
    }
}
```

---

# 8. SearchProducts DTO

```java
public record SearchProductsInput(

    String query,

    String semanticQuery,

    ProductSearchFilters filters,

    ProductSort sort,

    Integer limit

) {}
```

Filters:

```java
public record ProductSearchFilters(

    List<String> brands,

    List<String> categoryIds,

    List<String> colors,

    String gender,

    BigDecimal minPrice,

    BigDecimal maxPrice,

    List<String> sizes,

    Boolean inStock

) {}
```

---

# 9. MongoDB Full-text Search

Nếu hiện tại bạn đang dùng `$text`, giữ lại.

Product:

```java
@Document("products")
@CompoundIndexes({
    @CompoundIndex(
        name = "product_text_index",
        def = """
        {
          'name': 'text',
          'description': 'text',
          'tags': 'text',
          'brandName': 'text'
        }
        """
    )
})
public class ProductDocument {

    @Id
    private String id;

    private String name;

    private String description;

    private String brandName;

    private List<String> tags;

    private BigDecimal price;

    private List<String> colors;

}
```

Search:

```java
Query query =
        TextQuery
            .queryText(
                new TextCriteria()
                    .matching(searchText)
            )
            .sortByScore();

List<ProductDocument> products =
        mongoTemplate.find(
            query,
            ProductDocument.class
        );
```

---

# 10. Semantic Search

Semantic search không thay Mongo full-text.

Kiến trúc:

```text
               QUERY

"giày nhẹ để đi Nhật"

                 │
         ┌───────┴───────┐
         ↓               ↓

 Mongo Text        OpenAI Embedding
 Search                   ↓
                         Vector
                         Search
         │               │
         └───────┬───────┘
                 ↓

             Merge

                 ↓

             Filters

                 ↓

             Ranking
```

---

# 11. Embedding Document

```java
@Document("ai_product_embeddings")
@Data
@Builder
public class AiProductEmbedding {

    @Id
    private String id;

    @Indexed(unique = true)
    private String productId;

    private String text;

    private List<Double> embedding;

    private String embeddingModel;

    private String contentHash;

    private Integer version;

    private Instant createdAt;

    private Instant updatedAt;
}
```

---

# 12. Product Search Document Builder

```java
@Component
public class ProductSearchDocumentBuilder {

    public String build(Product product) {

        return """
            Product: %s
            Brand: %s
            Category: %s
            Description: %s
            Colors: %s
            Styles: %s
            Use cases: %s
            Fit: %s
            Materials: %s
            """
            .formatted(
                product.getName(),
                product.getBrandName(),
                product.getCategoryName(),
                product.getDescription(),
                String.join(
                    ", ",
                    product.getColors()
                ),
                String.join(
                    ", ",
                    product.getAiStyles()
                ),
                String.join(
                    ", ",
                    product.getAiUseCases()
                ),
                product.getFit(),
                String.join(
                    ", ",
                    product.getMaterials()
                )
            );
    }
}
```

---

# 13. Embedding Service

```java
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final OpenAiClient openAiClient;

    public List<Double> embed(String text) {

        return openAiClient.createEmbedding(
                text
        );
    }
}
```

Không embedding lại nếu content không đổi.

```text
Product
   ↓
buildSearchDocument()
   ↓
SHA-256
   ↓
compare contentHash
   ↓

same
→ skip

different
→ OpenAI embedding
```

---

# 14. Hybrid Search Service

```java
@Service
@RequiredArgsConstructor
public class HybridSearchService {

    private final ProductSearchService textSearch;

    private final SemanticSearchService semanticSearch;

    public SearchProductsResult search(
            SearchProductsInput input
    ) {

        var textResults =
                textSearch.search(input);

        var semanticResults =
                semanticSearch.search(input);

        return merge(
                textResults,
                semanticResults,
                input
        );
    }
}
```

Scoring bản đầu:

```text
FinalScore =

TextScore       * 0.35
+
SemanticScore   * 0.45
+
PopularityScore * 0.10
+
PersonalScore   * 0.10
```

Chưa có personalization thì:

```text
0.4 text
+
0.6 semantic
```

là đủ.

---

# 15. Personalized Size Advisor

Mongo document:

```java
@Document("user_foot_profiles")
@Data
@Builder
public class UserFootProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private Integer leftFootLengthMm;

    private Integer rightFootLengthMm;

    private Integer footWidthMm;

    private FootWidthType widthType;

    private PreferredFit preferredFit;

    private Map<String, String> usualSizes;

    private Instant createdAt;

    private Instant updatedAt;
}
```

Enums:

```java
public enum FootWidthType {
    NARROW,
    REGULAR,
    WIDE
}
```

```java
public enum PreferredFit {
    TIGHT,
    REGULAR,
    RELAXED
}
```

---

# 16. Fit History

```java
@Document("user_fit_history")
@Data
@Builder
public class UserFitHistory {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String productId;

    private String brandId;

    private String modelFamily;

    private String selectedSize;

    private FitResult result;

    private FitHistorySource source;

    private Instant createdAt;
}
```

```java
public enum FitResult {

    TOO_SMALL,

    SLIGHTLY_SMALL,

    PERFECT,

    SLIGHTLY_LARGE,

    TOO_LARGE
}
```

---

# 17. SizeAdvisorService

Quan trọng:

```text
Không để OpenAI tự tính size.
```

Spring Service tính trước.

```java
@Service
@RequiredArgsConstructor
public class SizeAdvisorService {

    private final UserFootProfileRepository footRepository;

    private final UserFitHistoryRepository fitRepository;

    private final ProductService productService;

    public SizeRecommendation recommend(
            String userId,
            String productId
    ) {

        UserFootProfile foot =
                footRepository
                    .findByUserId(userId)
                    .orElse(null);

        Product product =
                productService.getById(productId);

        List<UserFitHistory> history =
                fitRepository
                    .findByUserId(userId);

        // deterministic rules

        return calculate(
                foot,
                product,
                history
        );
    }
}
```

OpenAI chỉ làm:

```text
SizeAdvisorService
      ↓

EU 42.5
confidence HIGH
reasons [...]

      ↓

OpenAI

"Với chân 26.3cm và hơi bè,
mình nghiêng về 42.5..."
```

---

# 18. Return learning

Trong flow return hiện tại, nếu buyer chọn:

```text
SIZE_TOO_SMALL
```

thì sau khi return được xác nhận:

```java
fitHistoryService.record(
    FitHistoryEvent.builder()
        .userId(userId)
        .productId(productId)
        .selectedSize(size)
        .result(FitResult.TOO_SMALL)
        .source(FitHistorySource.RETURN)
        .build()
);
```

Đây là cách AI càng dùng càng cá nhân hóa tốt hơn.

---

# 19. Compare Product

```java
@Component
@RequiredArgsConstructor
public class CompareProductsTool
        implements AiTool<
            CompareProductsInput,
            ProductComparison
        > {

    private final ProductCompareService service;

    @Override
    public ProductComparison execute(
            CompareProductsInput input,
            AiRequestContext context
    ) {

        return service.compare(
                input.productIds()
        );
    }
}
```

Backend trả dữ liệu:

```java
public record ProductCompareItem(

    String productId,

    String name,

    BigDecimal price,

    Integer cushioning,

    Integer stability,

    Integer flexibility,

    Integer breathability,

    Integer walkingScore,

    Integer runningScore,

    String fit,

    List<String> availableSizes

) {}
```

OpenAI làm phần:

```text
User chạy 5km
+
75kg
+
Compare data

↓

recommend A

because...
```

---

# 20. Visual Search

Endpoint:

```http
POST /api/v1/ai/visual-search
Content-Type: multipart/form-data
```

Controller:

```java
@PostMapping(
    value = "/visual-search",
    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public VisualSearchResponse visualSearch(

        @RequestPart("image")
        MultipartFile image,

        @RequestPart(
            value = "message",
            required = false
        )
        String message
) {

    return visualSearchService.search(
            image,
            message
    );
}
```

Flow:

```text
MultipartFile
     ↓
validate

image/jpeg
image/png
size <= limit

     ↓

OpenAI Vision

     ↓

VisualProductDescriptor

     ↓

SemanticSearchService

     ↓

Product candidates
```

---

# 21. Structured React Response

Không trả mỗi:

```json
{
  "answer": "..."
}
```

Nên trả:

```java
public record AiChatResponse(

    String conversationId,

    String message,

    List<String> capabilities,

    List<AiUiBlock> ui,

    List<String> followUps,

    List<String> warnings

) {}
```

---

# 22. React Types

```typescript
export interface AiChatResponse {

  conversationId: string;

  message: string;

  capabilities: AiCapability[];

  ui: AiUiBlock[];

  followUps: string[];

  warnings: string[];
}
```

---

# 23. React UI Block

```typescript
export type AiUiBlock =

  | ProductCarouselBlock

  | ProductCompareBlock

  | SizeRecommendationBlock

  | OrderCardBlock

  | CouponCardBlock

  | OutfitBlock;
```

---

# 24. React structure

```text
src/features/ai/
│
├── components/
│   ├── AiChat.tsx
│   ├── AiMessage.tsx
│   ├── AiComposer.tsx
│   ├── AiProductCarousel.tsx
│   ├── AiProductCard.tsx
│   ├── AiCompareTable.tsx
│   ├── AiSizeRecommendation.tsx
│   ├── AiFollowUpChips.tsx
│   ├── AiImageUploader.tsx
│   └── AiVoiceButton.tsx
│
├── hooks/
│   ├── useAiChat.ts
│   └── useAiConversation.ts
│
├── api/
│   └── aiApi.ts
│
├── types/
│   └── ai.types.ts
│
└── pages/
    └── AiChatPage.tsx
```

---

# 25. React Tool Response Rendering

```tsx
function AiUiRenderer({
  block,
}: {
  block: AiUiBlock;
}) {

  switch (block.type) {

    case "PRODUCT_CAROUSEL":
      return (
        <AiProductCarousel
          data={block.data}
        />
      );

    case "SIZE_RECOMMENDATION":
      return (
        <AiSizeRecommendation
          data={block.data}
        />
      );

    case "PRODUCT_COMPARE":
      return (
        <AiCompareTable
          data={block.data}
        />
      );

    default:
      return null;
  }
}
```

---

# 26. TanStack Query

Mutation:

```typescript
export function useAiChat() {

  return useMutation({

    mutationFn: async (
      request: AiChatRequest
    ) => {

      const response =
        await api.post<AiChatResponse>(
          "/api/v1/ai/chat",
          request
        );

      return response.data;
    }

  });
}
```

Sau này khi streaming thì chuyển sang:

```text
fetch
+
ReadableStream
```

hoặc:

```text
SSE
```

---

# 27. Streaming với Spring Boot

Có 2 hướng.

### MVC

```java
SseEmitter
```

### WebFlux

```java
Flux<ServerSentEvent<?>>
```

Nếu project hiện tại đang dùng Spring MVC bình thường thì **không cần đổi toàn bộ sang WebFlux**.

Có thể dùng:

```java
@GetMapping(
    value = "/stream",
    produces = MediaType.TEXT_EVENT_STREAM_VALUE
)
public SseEmitter stream(...) {
}
```

---

# 28. Security

Tool:

```text
get_my_orders
```

không nhận:

```text
userId
```

AI không được quyết định user nào.

Backend:

```java
String userId =
    context.getUserId();
```

Ví dụ:

```java
@Component
public class GetOrdersTool {

    public Object execute(
        GetOrdersInput input,
        AiRequestContext context
    ) {

        if (!context.isAuthenticated()) {

            throw new AiToolException(
                "AUTH_REQUIRED"
            );
        }

        return orderService.mine(
                context.getUserId()
        );
    }
}
```

---

# 29. Tool Risk Level

Có thể thêm:

```java
public enum AiToolRisk {

    READ_ONLY,

    LOW_RISK_WRITE,

    HIGH_RISK
}
```

Tool:

```java
public interface AiTool<I, O> {

    String getName();

    AiToolRisk getRisk();

    ...
}
```

Mapping:

```text
search_products
→ READ_ONLY

get_orders
→ READ_ONLY

add_to_cart
→ LOW_RISK_WRITE

add_wishlist
→ LOW_RISK_WRITE

payment
→ KHÔNG expose

refund
→ KHÔNG expose
```

---

# 30. Không expose Repository cho AI

Không làm:

```java
MongoRepositoryTool
```

hay:

```java
executeQuery(String query)
```

Tool layer phải đi:

```text
AI

↓

SearchProductsTool

↓

ProductSearchService

↓

ProductRepository
```

Không:

```text
AI
↓
Mongo
```

---

# 31. Spring Config

```yaml
openai:

  api-key: ${OPENAI_API_KEY}

  agent-model: ${OPENAI_AGENT_MODEL}

  fast-model: ${OPENAI_FAST_MODEL}

  vision-model: ${OPENAI_VISION_MODEL}

  embedding-model: ${OPENAI_EMBEDDING_MODEL}

  realtime-model: ${OPENAI_REALTIME_MODEL}

  timeout-ms: 20000


ai:

  agent:

    max-tool-rounds: 5

    conversation-history-turns: 8

  search:

    text-top-k: 20

    semantic-top-k: 20

    final-top-k: 10

  embedding:

    reindex-on-startup: false
```

Config class:

```java
@ConfigurationProperties(
    prefix = "openai"
)
@Data
public class OpenAiProperties {

    private String apiKey;

    private String agentModel;

    private String fastModel;

    private String visionModel;

    private String embeddingModel;

    private String realtimeModel;

    private long timeoutMs;
}
```

---

# 32. Implementation roadmap

## Phase P0.1

```text
AI Tool Calling Agent
```

Implement:

```text
AiAgentService
AiTool
AiToolRegistry
AiToolExecutor
OpenAiClient
AiResponseBuilder
```

Tools đầu tiên:

```text
search_products
get_product
get_product_variants
get_my_orders
get_my_returns
```

---

## Phase P0.2

```text
Semantic Product Search
```

Implement:

```text
ProductSearchDocumentBuilder
EmbeddingService
AiProductEmbedding
SemanticSearchService
HybridSearchService
```

---

## Phase P0.3

```text
Personalized Size Advisor
```

Implement:

```text
UserFootProfile
UserFitHistory
SizeAdvisorService
RecommendSizeTool
SizeRecommendation UI
```

---

## Phase P1.1

```text
Product Compare
```

Implement:

```text
CompareProductsTool
ProductCompareService
AiCompareTable
```

---

## Phase P1.2

```text
Visual Search
```

Implement:

```text
Multipart image upload
ImageAnalysisService
VisualProductDescriptor
VisualSearchService
AiImageUploader
```

---

## Phase P2.1

```text
Outfit Studio
```

Implement:

```text
OutfitStylistService
Outfit recommendation
Image generation
React Outfit Studio
```

---

## Phase P2.2

```text
Voice Shopping
```

Implement cuối:

```text
Realtime session
WebRTC
Tool bridge
React voice UI
```

---

# 33. MVP cần đạt

Flow 1:

```text
User:

"Tìm tôi đôi chạy bộ
dưới 2 triệu."

↓

OpenAI

↓

search_products

↓

MongoDB

↓

ProductCarousel
```

Flow 2:

```text
"Cái nào hợp chân bè?"

↓

get_foot_profile

↓

get_variants

↓

recommend_size

↓

SizeCard
```

Flow 3:

```text
"So sánh đôi 1 và 2"

↓

compare_products

↓

CompareTable
```

Flow 4:

```text
"Thêm đôi 1 size 42 vào giỏ"

↓

add_to_cart

↓

Spring validates

↓

Cart updated
```

---

# 34. Architecture cuối

```text
React 19
   │
   ▼
Spring Boot Java 17
   │
   ▼
AiAgentService
   │
   ▼
OpenAI
   │
   ▼
Tool Calling
   │
   ├── Product
   ├── Size
   ├── Compare
   ├── Order
   ├── Return
   └── Cart
          │
          ▼
     Spring Services
          │
          ▼
       MongoDB
          │
    ┌─────┼─────────┐
    │     │         │
 Full   Semantic   Filters
 Text    Search
    │     │
    └──┬──┘
       ▼
   Products
       │
       ▼
    OpenAI
 reasoning/explanation
       │
       ▼
 Structured Response
       │
       ▼
    React 19
```

---

# 35. Rule quan trọng nhất

Với Spring Boot architecture:

```text
Controller
    ↓
AI Agent
    ↓
AI Tool
    ↓
Domain Service
    ↓
Repository
    ↓
MongoDB
```

AI **không được bypass**:

```text
Service layer
```

vì business rule vẫn phải do Spring Boot quản lý.

Công thức cuối cùng:

```text
OpenAI
= hiểu + reasoning + chọn tool

Spring Boot
= nghiệp vụ + security + validation

MongoDB
= dữ liệu thật

React 19
= trải nghiệm shopping
```

Đó là kiến trúc nên dùng cho toàn bộ AI Shopping Copilot của dự án.