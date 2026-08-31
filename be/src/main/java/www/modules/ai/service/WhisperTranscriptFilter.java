package www.modules.ai.service;

import org.springframework.stereotype.Component;
import www.modules.ai.dto.WhisperSegment;
import www.modules.ai.dto.WhisperVerboseResponse;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class WhisperTranscriptFilter {

    static final double NO_SPEECH_THRESHOLD = 0.6;
    static final double MIN_AVG_LOGPROB = -1.0;

    private static final List<Pattern> HALLUCINATION_PATTERNS = List.of(
            Pattern.compile("đăng k[íy].*kênh", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
            Pattern.compile("nhớ nhấn chuông|subscribe|like and share", Pattern.CASE_INSENSITIVE),
            Pattern.compile("không bỏ lỡ.*video", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
            Pattern.compile("cảm ơn.*đã theo dõi", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
            Pattern.compile("hãy subscribe|đừng quên subscribe", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
    );

    public String filter(WhisperVerboseResponse response) {
        if (response == null) {
            return "";
        }
        if (response.segments() != null && !response.segments().isEmpty()) {
            String fromSegments = response.segments().stream()
                    .filter(this::isReliableSegment)
                    .map(WhisperSegment::text)
                    .map(text -> text == null ? "" : text.trim())
                    .filter(text -> !text.isBlank())
                    .collect(Collectors.joining(" "))
                    .trim();
            if (!fromSegments.isBlank()) {
                return sanitize(fromSegments);
            }
            return "";
        }
        return sanitize(response.text());
    }

    public boolean looksLikeHallucination(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String normalized = text.trim();
        return HALLUCINATION_PATTERNS.stream().anyMatch(pattern -> pattern.matcher(normalized).find());
    }

    private boolean isReliableSegment(WhisperSegment segment) {
        if (segment == null || segment.text() == null || segment.text().isBlank()) {
            return false;
        }
        if (segment.noSpeechProb() != null && segment.noSpeechProb() >= NO_SPEECH_THRESHOLD) {
            return false;
        }
        if (segment.avgLogprob() != null && segment.avgLogprob() <= MIN_AVG_LOGPROB) {
            return false;
        }
        return !looksLikeHallucination(segment.text());
    }

    private String sanitize(String text) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim();
        if (trimmed.isBlank() || looksLikeHallucination(trimmed)) {
            return "";
        }
        return trimmed;
    }
}
