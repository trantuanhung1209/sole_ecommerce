import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  slug: z.string().min(1, "Slug không được để trống"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  brandId: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  genderTarget: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]).optional(),
  imageUrls: z.array(z.string()).default([]),
});

export const variantFormSchema = z.object({
  sku: z.string().min(1, "SKU không được để trống"),
  size: z.string().min(1, "Size không được để trống"),
  colorName: z.string().min(1, "Tên màu không được để trống"),
  colorHex: z.string().optional(),
  price: z.number().min(0, "Giá phải >= 0"),
  compareAtPrice: z.number().min(0).optional(),
  imageUrls: z.array(z.string()),
  initialStock: z.number().min(0).optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
export type VariantFormData = z.infer<typeof variantFormSchema>;
