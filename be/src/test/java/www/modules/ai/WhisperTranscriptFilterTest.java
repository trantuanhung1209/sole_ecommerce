package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.dto.WhisperSegment;
import www.modules.ai.dto.WhisperVerboseResponse;
import www.modules.ai.service.WhisperTranscriptFilter;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WhisperTranscriptFilterTest {

    private final WhisperTranscriptFilter filter = new WhisperTranscriptFilter();

    @Test
    void dropsHighNoSpeechSegments() {
        WhisperVerboseResponse response = new WhisperVerboseResponse(
                "đăng ký kênh nhé",
                List.of(
                        segment("đăng ký kênh nhé", 0.92, -0.3),
                        segment("giày nike size 42", 0.1, -0.2)
                )
        );

        assertEquals("giày nike size 42", filter.filter(response));
    }

    @Test
    void dropsLowConfidenceSegments() {
        WhisperVerboseResponse response = new WhisperVerboseResponse(
                "nhớ like share",
                List.of(segment("nhớ like share", 0.2, -1.5))
        );

        assertEquals("", filter.filter(response));
    }

    @Test
    void blacklistCatchesYoutubeOutroOnFullText() {
        assertTrue(filter.looksLikeHallucination("Hãy đăng ký kênh để không bỏ lỡ video mới nhé"));
        assertEquals("", filter.filter(new WhisperVerboseResponse(
                "Hãy đăng ký kênh để không bỏ lỡ video mới nhé",
                List.of()
        )));
    }

    @Test
    void keepsValidTranscript() {
        WhisperVerboseResponse response = new WhisperVerboseResponse(
                "tìm giày nike size 42",
                List.of(segment("tìm giày nike size 42", 0.05, -0.25))
        );

        assertEquals("tìm giày nike size 42", filter.filter(response));
    }

    private static WhisperSegment segment(String text, double noSpeechProb, double avgLogprob) {
        return new WhisperSegment(text, noSpeechProb, avgLogprob, 1.0);
    }
}
