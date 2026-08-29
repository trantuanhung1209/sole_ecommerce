package www.modules.ai.service.context;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import www.modules.common.EcommerceEnums.AiRouteType;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PolicyContextProvider {
    private final PolicyKnowledge policyKnowledge;

    public String build(AiRouteType routeType) {
        List<String> sections = new ArrayList<>();
        sections.add("=== CHÍNH SÁCH SOLE ===");
        sections.add(policyKnowledge.fullText("shipping"));
        sections.add(policyKnowledge.dynamicVatLine());

        switch (routeType) {
            case RETURN_POLICY -> {
                sections.add(policyKnowledge.fullText("return"));
            }
            case PAYMENT_REFUND_POLICY -> {
                sections.add(policyKnowledge.fullText("payment"));
                sections.add(policyKnowledge.fullText("return"));
            }
            case ORDER_STATUS -> {
                sections.add(policyKnowledge.fullText("order"));
                sections.add(policyKnowledge.fullText("payment"));
            }
            case PRODUCT_INFO, SIZE_ADVICE -> sections.add(policyKnowledge.fullText("coupon"));
            case CHITCHAT -> {
                // light policy summary only
            }
            default -> sections.add(policyKnowledge.fullText("order"));
        }

        sections.add("Lưu ý: AI chỉ tư vấn, không thể hủy đơn, hoàn tiền, hay tạo yêu cầu đổi trả thay khách.");
        return String.join("\n\n", sections.stream().filter(s -> s != null && !s.isBlank()).toList());
    }
}
