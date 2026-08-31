package www.modules.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WhisperSegment(
        String text,
        @JsonProperty("no_speech_prob") Double noSpeechProb,
        @JsonProperty("avg_logprob") Double avgLogprob,
        @JsonProperty("compression_ratio") Double compressionRatio
) {}
