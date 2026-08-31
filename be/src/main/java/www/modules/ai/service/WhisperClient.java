package www.modules.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import www.exception.BadRequestException;
import www.modules.ai.dto.WhisperVerboseResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhisperClient {

    static final String DOMAIN_VOCAB_HINT =
            "Giày thể thao, giày chạy bộ, giày bóng rổ, giày bóng đá, giày cầu lông, "
                    + "sneaker, sandal, dép, boot, size, Nike, Adidas, Puma, Converse, Vans, New Balance, "
                    + "đổi trả, bảo hành, thanh toán, giao hàng, size 39 40 41 42 43 44.";

    private final WebClient openAiWebClient;
    private final AiAudioValidator audioValidator;
    private final WhisperTranscriptFilter transcriptFilter;

    public String transcribe(MultipartFile audioFile) {
        audioValidator.validate(audioFile);

        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename() != null ? audioFile.getOriginalFilename() : "audio.webm";
                }
            }).contentType(MediaType.parseMediaType(
                    audioFile.getContentType() != null ? audioFile.getContentType() : "audio/webm"));
            builder.part("model", "whisper-1");
            builder.part("language", "vi");
            builder.part("response_format", "verbose_json");
            builder.part("temperature", "0");
            builder.part("prompt", DOMAIN_VOCAB_HINT);

            WhisperVerboseResponse response = openAiWebClient.post()
                    .uri("/audio/transcriptions")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(WhisperVerboseResponse.class)
                    .block();

            String transcript = transcriptFilter.filter(response);
            if (transcript.isBlank()) {
                throw new BadRequestException("Không nghe rõ, bạn vui lòng nói lại gần micro hơn nhé.");
            }
            return transcript;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Whisper transcription failed", ex);
            throw new BadRequestException("Không thể chuyển đổi giọng nói thành văn bản.");
        }
    }
}
