import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { catalogApi } from "@/services/ecommerceServices";
import { getErrorMessage } from "@/utils/getErrorMessage";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=200&q=80";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploader({ value, onChange, maxImages = 8, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${maxImages} ảnh`);
      return;
    }

    const selected = files.slice(0, remaining);
    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Mỗi ảnh không được vượt quá 5MB");
        return;
      }
    }
    const invalid = selected.find(
      (f) => !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)
    );
    if (invalid) {
      toast.error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP");
      return;
    }

    setUploading(true);
    try {
      const urls = await catalogApi.uploadImages(selected);
      onChange([...value, ...urls]);
      toast.success("Upload ảnh thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border">
            <img
              src={url}
              alt={`Ảnh ${index + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER;
              }}
            />
            {!disabled && (
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                onClick={() => removeAt(index)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {value.length < maxImages && !disabled && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-muted/50"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            Thêm ảnh
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
      <p className="text-xs text-muted-foreground">
        Tối đa {maxImages} ảnh, mỗi ảnh ≤ 5MB (JPEG, PNG, WebP)
      </p>
    </div>
  );
}
