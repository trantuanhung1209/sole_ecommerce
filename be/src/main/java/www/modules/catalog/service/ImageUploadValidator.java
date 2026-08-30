package www.modules.catalog.service;

import org.springframework.stereotype.Component;
import www.exception.BadRequestException;

import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Component
public class ImageUploadValidator {

    public void validateBatch(List<String> images, int maxImages) {
        if (images == null || images.isEmpty()) {
            throw new BadRequestException("Danh sách ảnh không được để trống");
        }
        if (images.size() > maxImages) {
            throw new BadRequestException("Tối đa " + maxImages + " ảnh mỗi lần upload");
        }
        images.forEach(this::validateImagePayload);
    }

    public void validateImagePayload(String image) {
        if (image == null || image.isBlank()) {
            throw new BadRequestException("Ảnh không được để trống");
        }
        if (!image.startsWith("data:image/")) {
            throw new BadRequestException("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP (định dạng base64 data URI)");
        }
        int semicolon = image.indexOf(';');
        if (semicolon < 0 || !image.contains("base64,")) {
            throw new BadRequestException("Dữ liệu ảnh base64 không hợp lệ");
        }
        String mime = image.substring(5, semicolon).toLowerCase(Locale.ROOT);
        if (!mime.equals("image/jpeg") && !mime.equals("image/jpg")
                && !mime.equals("image/png") && !mime.equals("image/webp")) {
            throw new BadRequestException("Định dạng ảnh không được hỗ trợ");
        }
        String base64 = image.substring(image.indexOf("base64,") + 7);
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Dữ liệu ảnh base64 không hợp lệ");
        }
        if (bytes.length > 5L * 1024 * 1024) {
            throw new BadRequestException("Mỗi ảnh không được vượt quá 5MB");
        }
    }
}
