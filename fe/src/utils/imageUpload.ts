export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Mỗi ảnh không được vượt quá 5MB";
  }
  return null;
}

export function validateImageFiles(files: File[], maxCount: number): string | null {
  if (files.length > maxCount) {
    return `Tối đa ${maxCount} ảnh`;
  }
  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return error;
  }
  return null;
}
