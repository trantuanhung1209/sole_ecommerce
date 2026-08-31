package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import www.modules.ai.dto.NormalizedTranscript;

@Service
@RequiredArgsConstructor
public class VoiceTranscriptService {

    private final WhisperClient whisperClient;
    private final TranscriptNormalizerService transcriptNormalizer;

    public NormalizedTranscript process(MultipartFile audioFile) {
        String rawTranscript = whisperClient.transcribe(audioFile);
        return transcriptNormalizer.normalize(rawTranscript);
    }

    public String processToText(MultipartFile audioFile) {
        return process(audioFile).getCorrectedText();
    }
}
