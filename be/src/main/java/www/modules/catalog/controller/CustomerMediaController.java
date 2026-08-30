package www.modules.catalog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import www.exception.BadRequestException;
import www.model.dto.response.ApiResponse;
import www.modules.catalog.dto.CatalogMediaDtos.UploadImagesRequest;
import www.modules.catalog.service.ImageUploadValidator;
import www.service.interfaces.CloudinaryService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class CustomerMediaController {

    private static final int MAX_CUSTOMER_IMAGES = 4;
    private static final Map<String, String> FOLDERS = Map.of(
            "reviews", "ecommerce/reviews",
            "returns", "ecommerce/returns");

    private final CloudinaryService cloudinaryService;
    private final ImageUploadValidator imageUploadValidator;

    @PostMapping("/images")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            @RequestParam(defaultValue = "reviews") String folder,
            @Valid @RequestBody UploadImagesRequest request) {
        String cloudinaryFolder = FOLDERS.get(folder);
        if (cloudinaryFolder == null) {
            throw new BadRequestException("Thư mục upload không hợp lệ");
        }
        List<String> images = request.getImages();
        imageUploadValidator.validateBatch(images, MAX_CUSTOMER_IMAGES);
        List<String> urls = cloudinaryService.uploadMultipleImagesToFolder(images, cloudinaryFolder);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", urls));
    }
}
