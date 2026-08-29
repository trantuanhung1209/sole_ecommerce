import axios from "axios";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadServices = {
  // Upload single image to Cloudinary
  uploadImage: async (base64Image: string): Promise<string> => {
    // Validate environment variables
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("Missing Cloudinary credentials:", {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      });
      throw new Error(
        "Thiếu cấu hình Cloudinary. Vui lòng kiểm tra file .env!"
      );
    }

    try {
      const formData = new FormData();
      
      // Append base64 image directly (Cloudinary accepts base64)
      formData.append("file", base64Image);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "reviews");

      console.log("Uploading to Cloudinary:", {
        cloudName: CLOUDINARY_CLOUD_NAME,
        preset: CLOUDINARY_UPLOAD_PRESET,
      });

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      console.log("Upload successful:", uploadResponse.data.secure_url);
      return uploadResponse.data.secure_url;
    } catch (error: any) {
      console.error("Error uploading image to Cloudinary:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // More specific error messages
      if (error.response?.status === 400) {
        throw new Error("Upload preset không hợp lệ hoặc chưa được tạo!");
      } else if (error.response?.status === 401) {
        throw new Error("Cloud name không đúng!");
      } else {
        throw new Error(
          error.response?.data?.error?.message ||
            "Không thể tải ảnh lên. Vui lòng thử lại!"
        );
      }
    }
  },

  // Upload multiple images to Cloudinary
  uploadMultipleImages: async (base64Images: string[]): Promise<string[]> => {
    try {
      const uploadPromises = base64Images.map((img) =>
        uploadServices.uploadImage(img)
      );
      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw new Error("Không thể tải ảnh lên. Vui lòng thử lại!");
    }
  },
};
