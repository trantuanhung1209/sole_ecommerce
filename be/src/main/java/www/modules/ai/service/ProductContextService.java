package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.modules.catalog.repository.ProductRepository;

@Service
@RequiredArgsConstructor
public class ProductContextService {
    private final ProductRepository productRepository;

    public String buildContext(String message) {
        var products = productRepository.search(message == null ? "" : message, org.springframework.data.domain.PageRequest.of(0, 5));
        StringBuilder context = new StringBuilder("Available product snippets:\n");
        products.forEach(product -> context
                .append("- ")
                .append(product.getName())
                .append(": ")
                .append(product.getShortDescription() != null ? product.getShortDescription() : product.getDescription())
                .append("\n"));
        context.append("\nPolicies: AI can advise products, sizes, order status meaning, payment and return policy. AI must not mutate orders, payments, or refunds.");
        return context.toString();
    }
}
