package www.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormalizedTranscript {
    private String correctedText;
    @Builder.Default
    private List<TranscriptCorrection> corrections = new ArrayList<>();

    public static NormalizedTranscript unchanged(String text) {
        return NormalizedTranscript.builder()
                .correctedText(text == null ? "" : text)
                .corrections(List.of())
                .build();
    }
}
