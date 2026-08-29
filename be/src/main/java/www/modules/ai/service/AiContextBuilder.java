package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.AiContextResult;
import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.model.AiConversation;
import www.modules.ai.service.context.OrderContextProvider;
import www.modules.ai.service.context.PolicyContextProvider;
import www.modules.ai.service.context.ReturnContextProvider;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiContextBuilder {
    private final AiRetrievalService retrievalService;
    private final PolicyContextProvider policyContextProvider;
    private final OrderContextProvider orderContextProvider;
    private final ReturnContextProvider returnContextProvider;

    public AiContextResult build(String userId, AiRouteType routeType, String message, AiConversation conversation) {
        List<String> sections = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Map<String, SuggestedProduct> suggested = new LinkedHashMap<>();

        AiRetrievalService.RetrievalResult retrieval = retrievalService.retrieve(message, routeType);
        if (!retrieval.contextText().isBlank()) {
            sections.add(retrieval.contextText());
        }
        retrieval.suggestedProducts().forEach(p -> suggested.putIfAbsent(p.getProductId(), p));

        sections.add(policyContextProvider.build(routeType));

        OrderContextProvider.Contribution orders = orderContextProvider.contribute(userId, routeType, message);
        if (!orders.contextText().isBlank()) {
            sections.add(orders.contextText());
        }
        warnings.addAll(orders.warnings());

        OrderContextProvider.Contribution returns = returnContextProvider.contribute(userId, routeType);
        if (!returns.contextText().isBlank()) {
            sections.add(returns.contextText());
        }
        warnings.addAll(returns.warnings());

        String contextText = sections.stream()
                .filter(section -> section != null && !section.isBlank())
                .reduce((a, b) -> a + "\n\n" + b)
                .orElse("");

        return AiContextResult.builder()
                .contextText(contextText)
                .suggestedProducts(new ArrayList<>(suggested.values()))
                .warnings(warnings.stream().distinct().toList())
                .build();
    }
}
