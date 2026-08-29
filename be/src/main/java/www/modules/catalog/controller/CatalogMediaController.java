package www.modules.catalog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import www.exception.BadRequestException;
import www.model.dto.response.ApiResponse;
import www.modules.catalog.dto.CatalogMediaDtos.UploadImagesRequest;
import www.service.interfaces.CloudinaryService;

import java.util.Base64;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/admin/catalog")
@RequiredArgsConstructor
public class CatalogMediaController {

    private static final int MAX_IMAGES = 8;
    private static final long MAX_BYTES_PER_IMAGE = 5L * 1024 * 1024;

    private final CloudinaryService cloudinaryService;

    @PostMapping("/images")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SHOP_MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            @Valid @RequestBody UploadImagesRequest request) {
        List<String> images = request.getImages();
        if (images == null || images.isEmpty()) {
            throw new BadRequestException("Danh sách ảnh không được để trống");
        }
        if (images.size() > MAX_IMAGES) {
            throw new BadRequestException("Tối đa " + MAX_IMAGES + " ảnh mỗi lần upload");
        }
        images.forEach(this::validateImagePayload);
        List<String> urls = cloudinaryService.uploadMultipleImagesToFolder(images, "ecommerce/products");
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", urls));
    }

    private void validateImagePayload(String image) {
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
        if (bytes.length > MAX_BYTES_PER_IMAGE) {
            throw new BadRequestException("Mỗi ảnh không được vượt quá 5MB");
        }
    }
}
