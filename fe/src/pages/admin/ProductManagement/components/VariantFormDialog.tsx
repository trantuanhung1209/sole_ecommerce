import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { variantFormSchema, type VariantFormData } from "@/schemas/productSchema";
import { productApi } from "@/services/ecommerceServices";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Brand, VariantView } from "@/types/ecommerce.type";

const SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  brand?: Brand | null;
  variant?: VariantView | null;
  inventoryBasePath: string;
  onSaved: () => void;
}

function suggestSku(brandSlug: string, colorName: string, size: string) {
  const parts = [brandSlug || "sku", colorName, size]
    .filter(Boolean)
    .map((p) =>
      p
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  return parts.join("-");
}

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  brand,
  variant,
  inventoryBasePath,
  onSaved,
}: VariantFormDialogProps) {
  const isEdit = Boolean(variant?.variantId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      sku: "",
      size: "42",
      colorName: "",
      colorHex: "#111111",
      price: 0,
      compareAtPrice: undefined,
      imageUrls: [],
      initialStock: 0,
    },
  });

  const colorName = watch("colorName");
  const size = watch("size");
  const imageUrls = watch("imageUrls");

  useEffect(() => {
    if (!open) return;
    if (variant) {
      reset({
        sku: variant.sku,
        size: variant.size,
        colorName: variant.colorName,
        colorHex: variant.colorHex || "#111111",
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        imageUrls: variant.imageUrls || [],
        initialStock: 0,
      });
    } else {
      reset({
        sku: "",
        size: "42",
        colorName: "",
        colorHex: "#111111",
        price: 0,
        compareAtPrice: undefined,
        imageUrls: [],
        initialStock: 0,
      });
    }
  }, [open, variant, reset]);

  useEffect(() => {
    if (!isEdit && colorName && size) {
      setValue("sku", suggestSku(brand?.slug || "", colorName, size));
    }
  }, [brand?.slug, colorName, isEdit, setValue, size]);

  const onSubmit = async (data: VariantFormData) => {
    const payload = {
      sku: data.sku,
      size: data.size,
      colorName: data.colorName,
      colorHex: data.colorHex,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      imageUrls: data.imageUrls,
      initialStock: isEdit ? undefined : data.initialStock ?? 0,
    };

    try {
      if (isEdit && variant) {
        await productApi.updateVariant(productId, variant.variantId, payload);
        toast.success("Cập nhật biến thể thành công");
      } else {
        await productApi.createVariant(productId, payload);
        toast.success("Tạo biến thể thành công");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa biến thể" : "Thêm biến thể"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="colorName">Màu</Label>
              <Input id="colorName" {...register("colorName")} placeholder="Đen" />
              {errors.colorName && <p className="text-xs text-destructive">{errors.colorName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colorHex">Mã màu</Label>
              <Input id="colorHex" type="color" className="h-10 p-1" {...register("colorHex")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Size</Label>
            <Select value={size} onValueChange={(v) => setValue("size", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn size" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.size && <p className="text-xs text-destructive">{errors.size.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register("sku")} />
            {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Giá bán (VND)</Label>
              <Input id="price" type="number" min={0} {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compareAtPrice">Giá gốc (VND)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                min={0}
                {...register("compareAtPrice", {
                  setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ảnh biến thể (theo màu)</Label>
            <ImageUploader value={imageUrls} onChange={(urls) => setValue("imageUrls", urls)} maxImages={4} />
          </div>

          {isEdit && variant ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p>
                Tồn kho: <strong>{variant.available ?? 0}</strong> khả dụng /{" "}
                <strong>{variant.onHand ?? 0}</strong> tồn
              </p>
              <Link to={inventoryBasePath} className="text-primary underline-offset-2 hover:underline">
                Điều chỉnh tại Inventory
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="initialStock">Tồn kho ban đầu</Label>
              <Input id="initialStock" type="number" min={0} {...register("initialStock", { valueAsNumber: true })} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Lưu" : "Tạo biến thể"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
