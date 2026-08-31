package www.modules.ai.service;

import www.modules.ai.dto.AiDtos.SuggestedProduct;
import www.modules.ai.dto.VisionAnalysis;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

public final class ImageSearchMatcher {
    private static final Pattern NON_ALPHANUM = Pattern.compile("[^a-z0-9]+");

    private ImageSearchMatcher() {}

    public static List<SuggestedProduct> filterExactMatches(
            List<SuggestedProduct> products,
            VisionAnalysis vision,
            List<String> brandNames) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }
        List<SuggestedProduct> matches = new ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            SuggestedProduct product = products.get(i);
            String brandName = brandNames != null && i < brandNames.size() ? brandNames.get(i) : null;
            if (isExactMatch(product, brandName, vision)) {
                matches.add(product);
            }
        }
        return matches;
    }

    static boolean isExactMatch(SuggestedProduct product, String brandName, VisionAnalysis vision) {
        if (product == null || vision == null) {
            return false;
        }
        String haystack = normalize(product.getName()) + " " + normalize(brandName);

        if (vision.isBrandIdentified() && hasText(vision.getBrand())) {
            String brandToken = normalize(vision.getBrand());
            if (!brandToken.isBlank() && !containsToken(haystack, brandToken)) {
                return false;
            }
        }

        if (hasText(vision.getModel())) {
            if (!containsModelTokens(haystack, vision.getModel())) {
                return false;
            }
        }

        if (!vision.isBrandIdentified() && !hasText(vision.getModel())) {
            return hasText(vision.getDescription()) && containsModelTokens(haystack, vision.getDescription());
        }

        return vision.isBrandIdentified() || hasText(vision.getModel());
    }

    private static boolean containsModelTokens(String haystack, String model) {
        String normalizedModel = normalize(model);
        if (normalizedModel.isBlank()) {
            return true;
        }
        String[] tokens = normalizedModel.split("\\s+");
        int required = tokens.length >= 2 ? 2 : 1;
        int matched = 0;
        for (String token : tokens) {
            if (token.length() < 3) {
                continue;
            }
            if (containsToken(haystack, token)) {
                matched++;
            }
        }
        return matched >= required;
    }

    private static boolean containsToken(String haystack, String token) {
        if (token == null || token.isBlank()) {
            return true;
        }
        return haystack.contains(token);
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        normalized = normalized.toLowerCase(Locale.ROOT);
        return NON_ALPHANUM.matcher(normalized).replaceAll(" ").trim();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
