package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.dto.TranscriptCorrection;
import www.modules.ai.service.TranscriptNormalizerService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TranscriptNormalizerServiceTest {

    @Test
    void overCorrectedWhenTooManyCorrections() {
        String raw = "tìm giày bóng rổ size 42";
        List<TranscriptCorrection> corrections = List.of(
                new TranscriptCorrection("tìm", "cho"),
                new TranscriptCorrection("giày", "mẫu"),
                new TranscriptCorrection("bóng", "thể"),
                new TranscriptCorrection("rổ", "thao"),
                new TranscriptCorrection("size", "cỡ"),
                new TranscriptCorrection("42", "43")
        );

        assertTrue(TranscriptNormalizerService.isOverCorrected(raw, corrections));
    }

    @Test
    void notOverCorrectedForSingleFix() {
        String raw = "tìm giày bóng rục size 42";
        List<TranscriptCorrection> corrections = List.of(
                new TranscriptCorrection("bóng rục", "bóng rổ")
        );

        assertFalse(TranscriptNormalizerService.isOverCorrected(raw, corrections));
    }
}
