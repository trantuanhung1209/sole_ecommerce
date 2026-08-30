package www.modules.catalog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import www.exception.BadRequestException;
import www.model.dto.response.ApiResponse;
import www.modules.catalog.dto.CatalogMediaDtos.UploadImagesRequest;
import www.modules.catalog.service.ImageUploadValidator;
import www.service.interfaces.CloudinaryService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/media")
@RequiredArgsConstructor
public class AdminMediaController {

    private static final int MAX_REFUND_PROOF_IMAGES = 1;
    private static final Map<String, String> FOLDERS = Map.of(
            "refund-proofs", "ecommerce/refund-proofs");

    private final CloudinaryService cloudinaryService;
    private final ImageUploadValidator imageUploadValidator;

    @PostMapping("/images")
    @PreAuthorize("hasAnyRole('SHOP_MANAGER','ADMIN','SUPER_ADMIN') or @perm.has(authentication, 'RETURN_PROCESS')")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            @RequestParam(defaultValue = "refund-proofs") String folder,
            @Valid @RequestBody UploadImagesRequest request) {
        String cloudinaryFolder = FOLDERS.get(folder);
        if (cloudinaryFolder == null) {
            throw new BadRequestException("Thư mục upload không hợp lệ");
        }
        List<String> images = request.getImages();
        imageUploadValidator.validateBatch(images, MAX_REFUND_PROOF_IMAGES);
        List<String> urls = cloudinaryService.uploadMultipleImagesToFolder(images, cloudinaryFolder);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", urls));
    }
}
