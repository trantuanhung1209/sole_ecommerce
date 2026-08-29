package www.service.implement;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.service.interfaces.CloudinaryService;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadImage(String base64Image) {
        return uploadImageToFolder(base64Image, "ecommerce/products");
    }

    @Override
    public List<String> uploadMultipleImages(List<String> base64Images) {
        return uploadMultipleImagesToFolder(base64Images, "ecommerce/products");
    }

    @Override
    public String uploadImageToFolder(String base64Image, String folder) {
        try {
            log.info("Uploading image to Cloudinary folder: {}", folder);
            
            // Xóa prefix "data:image/...;base64," nếu có
            String cleanBase64 = cleanBase64String(base64Image);
            
            // Decode base64
            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);
            
            // Upload lên Cloudinary với folder tùy chỉnh
            Map uploadResult = cloudinary.uploader().upload(imageBytes, 
                ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image"
                ));
            
            String imageUrl = (String) uploadResult.get("secure_url");
            log.info("Image uploaded successfully to {}: {}", folder, imageUrl);
            
            return imageUrl;
            
        } catch (Exception e) {
            log.error("Error uploading image to Cloudinary: {}", e.getMessage());
            throw new BadRequestException("Lỗi khi upload ảnh: " + e.getMessage());
        }
    }

    @Override
    public List<String> uploadMultipleImagesToFolder(List<String> base64Images, String folder) {
        log.info("Uploading {} images to Cloudinary folder: {}", base64Images.size(), folder);
        
        List<String> imageUrls = new ArrayList<>();
        
        for (int i = 0; i < base64Images.size(); i++) {
            try {
                String imageUrl = uploadImageToFolder(base64Images.get(i), folder);
                imageUrls.add(imageUrl);
                log.info("Uploaded image {}/{} to folder {}", i + 1, base64Images.size(), folder);
            } catch (Exception e) {
                log.error("Error uploading image {}/{}: {}", i + 1, base64Images.size(), e.getMessage());
                // Rollback: Xóa các ảnh đã upload
                imageUrls.forEach(this::deleteImage);
                throw new BadRequestException("Lỗi khi upload ảnh thứ " + (i + 1));
            }
        }
        
        log.info("All {} images uploaded successfully to folder {}", base64Images.size(), folder);
        return imageUrls;
    }

    @Override
    public boolean deleteImage(String imageUrl) {
        try {
            log.info("Deleting image from Cloudinary: {}", imageUrl);
            
            // Extract public_id from URL
            String publicId = extractPublicIdFromUrl(imageUrl);
            
            if (publicId == null) {
                log.warn("Cannot extract public_id from URL: {}", imageUrl);
                return false;
            }
            
            // Delete from Cloudinary
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            
            String resultStatus = (String) result.get("result");
            boolean success = "ok".equals(resultStatus);
            
            if (success) {
                log.info("Image deleted successfully: {}", imageUrl);
            } else {
                log.warn("Image deletion failed: {}", imageUrl);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("Error deleting image from Cloudinary: {}", e.getMessage());
            return false;
        }
    }

    //Xóa prefix "data:image/...;base64," khỏi chuỗi base64
    private String cleanBase64String(String base64Image) {
        if (base64Image == null || base64Image.isEmpty()) {
            throw new BadRequestException("Ảnh không được để trống");
        }
        
        // Nếu có prefix, xóa nó
        if (base64Image.contains(",")) {
            return base64Image.split(",")[1];
        }
        
        return base64Image;
    }

    // Extract public_id từ Cloudinary URL
    private String extractPublicIdFromUrl(String imageUrl) {
        try {
            // Pattern để extract public_id từ Cloudinary URL
            Pattern pattern = Pattern.compile(".*/upload/(?:v\\d+/)?(.*?)\\.[^.]+$");
            Matcher matcher = pattern.matcher(imageUrl);
            
            if (matcher.find()) {
                return matcher.group(1);
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error extracting public_id from URL: {}", e.getMessage());
            return null;
        }
    }
}
