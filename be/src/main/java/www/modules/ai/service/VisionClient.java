package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import www.modules.ai.dto.VisionAnalysis;

@Service
@RequiredArgsConstructor
public class VisionClient {

    private final OpenAiClient openAiClient;

    private static final String ANALYSIS_PROMPT =
            "Phân tích ảnh giày dép để tìm trong catalog e-commerce.\n"
                    + "Quy tắc:\n"
                    + "- Nhận diện thương hiệu (Nike, Adidas, MLB, New Balance...) chỉ khi thấy logo/chữ rõ; không chắc thì brand=\"\" và brandIdentified=false.\n"
                    + "- Nhận diện model (Chunky Liner, Air Force 1, Samba...) chỉ khi chắc; không chắc thì model=\"\".\n"
                    + "- color, style, category: mô tả ngắn tiếng Việt.\n"
                    + "- description: 1-2 câu tiếng Việt mô tả đôi giày trong ảnh.\n"
                    + "- searchQuery: từ khóa tìm catalog, ưu tiên brand + model; không thêm từ chung chung như 'sneaker' nếu đã có brand/model.\n"
                    + "- brandIdentified=true chỉ khi nhận ra thương hiệu rõ ràng.";

    public VisionAnalysis analyzeImage(String imageUrl) {
        return openAiClient.analyzeImage(imageUrl, ANALYSIS_PROMPT);
    }

    public String describeImage(String imageUrl) {
        VisionAnalysis analysis = analyzeImage(imageUrl);
        if (analysis.getDescription() != null && !analysis.getDescription().isBlank()) {
            return analysis.getDescription();
        }
        return analysis.displayLabel();
    }

    public String describeImage(String imageUrl, String prompt) {
        VisionAnalysis analysis = openAiClient.analyzeImage(imageUrl, prompt);
        if (analysis.getDescription() != null && !analysis.getDescription().isBlank()) {
            return analysis.getDescription();
        }
        return analysis.displayLabel();
    }
}
