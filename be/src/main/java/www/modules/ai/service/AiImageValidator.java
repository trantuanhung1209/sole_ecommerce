package www.modules.ai.service;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import www.exception.BadRequestException;

@Component
public class AiImageValidator {

    private static final long MAX_BYTES = 10L * 1024 * 1024;

    public byte[] validateAndRead(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Ảnh không được để trống.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Ảnh không được vượt quá 10MB.");
        }
        try {
            byte[] bytes = file.getBytes();
            ImageFormatDetector.ImageFormat format = ImageFormatDetector.detect(bytes);
            if (format == ImageFormatDetector.ImageFormat.UNKNOWN) {
                throw new BadRequestException("Định dạng ảnh không được hỗ trợ.");
            }
            return bytes;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Không thể đọc file ảnh.");
        }
    }
}
