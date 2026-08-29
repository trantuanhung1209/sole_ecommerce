package www.modules.ai.service.context;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Slf4j
public class PolicyKnowledge {
    @Value("${vat.rate:0}")
    private double vatRate;

    @Value("${shipping.flat-fee:30000}")
    private double flatFee;

    @Value("${shipping.free-threshold:2000000}")
    private double freeThreshold;

    @Getter
    private final Map<String, PolicyEntry> policies = new LinkedHashMap<>();

    @PostConstruct
    void loadPolicies() {
        try (InputStream input = new ClassPathResource("ai/policies.yml").getInputStream()) {
            Yaml yaml = new Yaml();
            Map<String, Object> root = yaml.load(input);
            if (root == null || !root.containsKey("policies")) {
                return;
            }
            @SuppressWarnings("unchecked")
            Map<String, Map<String, String>> raw = (Map<String, Map<String, String>>) root.get("policies");
            raw.forEach((name, value) -> {
                String key = value.getOrDefault("key", name);
                policies.put(key, new PolicyEntry(
                        key,
                        value.getOrDefault("title", name),
                        value.getOrDefault("body", "")
                ));
            });
        } catch (Exception ex) {
            log.warn("Failed to load ai/policies.yml: {}", ex.getMessage());
        }
    }

    public String dynamicShippingLine() {
        return String.format(
                "Phí vận chuyển: %,.0f VND cho đơn dưới %,.0f VND; miễn phí ship từ %,.0f VND trở lên.",
                flatFee,
                freeThreshold,
                freeThreshold
        );
    }

    public String dynamicVatLine() {
        if (vatRate <= 0) {
            return "VAT: hiện không áp dụng (vat.rate = 0).";
        }
        return String.format("VAT: %.0f%% trên (subtotal - discount).", vatRate * 100);
    }

    public String fullText(String policyKey) {
        PolicyEntry entry = policies.get(policyKey);
        if (entry == null) {
            return "";
        }
        StringBuilder text = new StringBuilder(entry.title()).append("\n").append(entry.body().trim());
        if ("shipping".equals(policyKey)) {
            text.append("\n").append(dynamicShippingLine());
        }
        if ("payment".equals(policyKey)) {
            text.append("\n").append(dynamicVatLine());
        }
        return text.toString();
    }

    public String allPoliciesText() {
        StringBuilder builder = new StringBuilder();
        policies.forEach((key, entry) -> {
            builder.append("[").append(entry.title()).append("]\n");
            builder.append(fullText(key)).append("\n\n");
        });
        return builder.toString().trim();
    }

    public record PolicyEntry(String key, String title, String body) {}
}
