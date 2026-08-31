package www.modules.ai.service;

import org.springframework.stereotype.Component;
import www.exception.BadRequestException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;

@Component
public class AiAudioValidator {

    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("webm", "mp3", "wav", "m4a", "ogg", "mp4", "mpeg");

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File âm thanh không được để trống.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("File âm thanh không được vượt quá 10MB.");
        }
        String filename = file.getOriginalFilename();
        if (filename != null) {
            String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new BadRequestException("Định dạng âm thanh không được hỗ trợ.");
            }
        }
        byte[] header = readHeader(file, 12);
        if (!looksLikeAudio(header)) {
            throw new BadRequestException("File không phải định dạng âm thanh hợp lệ.");
        }
    }

    private boolean looksLikeAudio(byte[] header) {
        if (header.length < 4) {
            return false;
        }
        // ID3 (MP3)
        if (header[0] == 'I' && header[1] == 'D' && header[2] == '3') {
            return true;
        }
        // RIFF/WAV
        if (header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F') {
            return true;
        }
        // Ogg
        if (header[0] == 'O' && header[1] == 'g' && header[2] == 'g' && header[3] == 'S') {
            return true;
        }
        // WebM/Matroska (EBML header 0x1A45DFA3)
        if (header.length >= 4
                && (header[0] & 0xFF) == 0x1A
                && (header[1] & 0xFF) == 0x45
                && (header[2] & 0xFF) == 0xDF
                && (header[3] & 0xFF) == 0xA3) {
            return true;
        }
        // MP4/M4A ftyp
        if (header.length >= 8 && header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p') {
            return true;
        }
        // MP3 frame sync
        return (header[0] & 0xFF) == 0xFF && (header[1] & 0xE0) == 0xE0;
    }

    private byte[] readHeader(MultipartFile file, int length) {
        try {
            byte[] bytes = file.getBytes();
            int size = Math.min(length, bytes.length);
            byte[] header = new byte[size];
            System.arraycopy(bytes, 0, header, 0, size);
            return header;
        } catch (Exception ex) {
            throw new BadRequestException("Không thể đọc file âm thanh.");
        }
    }
}
