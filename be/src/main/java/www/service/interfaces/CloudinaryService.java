package www.service.interfaces;

import java.util.List;

public interface CloudinaryService {

    String uploadImage(String base64Image);

    List<String> uploadMultipleImages(List<String> base64Images);

    String uploadImageToFolder(String base64Image, String folder);

    List<String> uploadMultipleImagesToFolder(List<String> base64Images, String folder);

    boolean deleteImage(String imageUrl);
}
