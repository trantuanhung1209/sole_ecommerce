package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import www.modules.ai.service.AiAudioValidator;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiAudioValidatorTest {

    private final AiAudioValidator validator = new AiAudioValidator();

    @Test
    void acceptsWebmEbmlHeader() {
        byte[] webm = new byte[] {
                0x1A, 0x45, (byte) 0xDF, (byte) 0xA3,
                0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F
        };
        MockMultipartFile file = new MockMultipartFile("audio", "voice.webm", "audio/webm", webm);
        assertDoesNotThrow(() -> validator.validate(file));
    }

    @Test
    void acceptsWavRiffHeader() {
        byte[] wav = "RIFFxxxxWAVE".getBytes();
        MockMultipartFile file = new MockMultipartFile("audio", "voice.wav", "audio/wav", wav);
        assertDoesNotThrow(() -> validator.validate(file));
    }

    @Test
    void rejectsNonAudioPayload() {
        byte[] text = "not-audio-file".getBytes();
        MockMultipartFile file = new MockMultipartFile("audio", "voice.webm", "audio/webm", text);
        assertThrows(Exception.class, () -> validator.validate(file));
    }
}
