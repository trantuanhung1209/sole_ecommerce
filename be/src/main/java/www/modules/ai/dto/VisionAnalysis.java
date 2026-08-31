package www.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisionAnalysis {
    private String brand;
    private String model;
    private String color;
    private String style;
    private String category;
    private String description;
    private String searchQuery;
    private boolean brandIdentified;

    public String displayLabel() {
        return shortLabel();
    }

    /** Nhãn ngắn cho warning/UI — không dùng mô tả dài. */
    public String shortLabel() {
        String brandModel = brandModelLabel();
        if (!brandModel.isBlank()) {
            return brandModel;
        }
        String styleColor = joinParts(style, color);
        if (!styleColor.isBlank()) {
            return styleColor;
        }
        if (hasText(category)) {
            return category.trim();
        }
        return "mẫu giày trong ảnh";
    }

    /** Tóm tắt thân thiện cho câu trả lời — tối đa ~1 dòng. */
    public String friendlySummary() {
        String brandModel = brandModelLabel();
        if (!brandModel.isBlank()) {
            if (hasText(color)) {
                return brandModel + " màu " + color.trim();
            }
            return brandModel;
        }

        StringBuilder summary = new StringBuilder();
        if (hasText(style)) {
            summary.append(style.trim());
        }
        if (hasText(color)) {
            if (!summary.isEmpty()) {
                summary.append(' ');
            }
            summary.append("màu ").append(color.trim());
        }
        if (hasText(category) && summary.length() < 40) {
            if (!summary.isEmpty()) {
                summary.append(" — ");
            }
            summary.append(category.trim());
        }
        if (!summary.isEmpty()) {
            return summary.toString();
        }

        if (hasText(description)) {
            return truncate(description, 80);
        }
        return "mẫu giày trong ảnh";
    }

    private String brandModelLabel() {
        StringBuilder label = new StringBuilder();
        if (hasText(brand)) {
            label.append(brand.trim());
        }
        if (hasText(model)) {
            if (!label.isEmpty()) {
                label.append(' ');
            }
            label.append(model.trim());
        }
        return label.toString();
    }

    private static String joinParts(String first, String second) {
        StringBuilder joined = new StringBuilder();
        if (hasText(first)) {
            joined.append(first.trim());
        }
        if (hasText(second)) {
            if (!joined.isEmpty()) {
                joined.append(' ');
            }
            joined.append(second.trim());
        }
        return joined.toString();
    }

    private static String truncate(String value, int maxLength) {
        String normalized = value.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        int cut = normalized.lastIndexOf(' ', maxLength);
        if (cut < 20) {
            cut = maxLength;
        }
        return normalized.substring(0, cut).trim() + "…";
    }

    public String primarySearchQuery() {
        if (hasText(searchQuery)) {
            return searchQuery.trim();
        }
        StringBuilder query = new StringBuilder();
        if (hasText(brand)) {
            query.append(brand.trim());
        }
        if (hasText(model)) {
            if (!query.isEmpty()) {
                query.append(' ');
            }
            query.append(model.trim());
        }
        if (!query.isEmpty()) {
            return query.toString();
        }
        if (hasText(style) && hasText(color)) {
            return style.trim() + " " + color.trim();
        }
        if (hasText(style)) {
            return style.trim();
        }
        if (hasText(color)) {
            return color.trim();
        }
        return "giày sneaker";
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
