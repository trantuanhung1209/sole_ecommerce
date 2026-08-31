package www.modules.ai.dto;

import java.util.List;

public record WhisperVerboseResponse(String text, List<WhisperSegment> segments) {}
