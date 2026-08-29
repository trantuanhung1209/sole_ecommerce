import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VariantFormDialog } from "./components/VariantFormDialog";
import { brandApi, categoryApi, money, productApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { Brand, Category, Product, VariantView } from "@/types/ecommerce.type";

type TabId = "info" | "variants";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=200&q=80";

export default function ProductDetailAdminPage() {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { access } = useRoleAccess();

  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin";
  const listPath = `${basePath}/products`;

  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<VariantView[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantView | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [genderTarget, setGenderTarget] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const selectedBrand = useMemo(
    () => brands.find((b) => b.brandId === brandId) || null,
    [brandId, brands]
  );

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const [p, v, b, c] = await Promise.all([
        productApi.detail(productId),
        productApi.adminVariants(productId),
        brandApi.list(),
        categoryApi.list(),
      ]);
      setProduct(p);
      setVariants(v);
      setBrands(b);
      setCategories(c);
      setName(p.name);
      setSlug(p.slug);
      setShortDescription(p.shortDescription || "");
      setDescription(p.description || "");
      setBrandId(p.brandId || "");
      setCategoryIds(p.categoryIds || []);
      setGenderTarget(p.genderTarget || "");
      setImageUrls(p.imageUrls || []);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const reloadVariants = async () => {
    const v = await productApi.adminVariants(productId);
    setVariants(v);
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const updated = await productApi.update(product.productId, {
        name,
        slug,
        shortDescription,
        description,
        brandId: brandId || undefined,
        categoryIds,
        genderTarget: genderTarget as Product["genderTarget"],
        imageUrls,
      });
      setProduct(updated);
      toast.success("Đã lưu sản phẩm");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async (action: () => Promise<Product>, successMsg: string) => {
    try {
      const updated = await action();
      setProduct(updated);
      toast.success(successMsg);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePublish = async () => {
    const activeVariants = variants.filter((v) => v.status === "ACTIVE");
    if (activeVariants.length === 0) {
      toast.error("Cần ít nhất một biến thể đang hoạt động trước khi xuất bản");
      setActiveTab("variants");
      return;
    }
    const hasProductImages = imageUrls.length > 0;
    const allVariantsHaveImages = activeVariants.every((v) => (v.imageUrls?.length ?? 0) > 0);
    if (!hasProductImages && !allVariantsHaveImages) {
      toast.error("Cần ảnh sản phẩm hoặc ảnh cho từng biến thể đang hoạt động");
      return;
    }
    const lowStock = activeVariants.some((v) => (v.available ?? 0) <= 0);
    if (lowStock) {
      toast.warn("Một số biến thể chưa có tồn kho khả dụng");
    }
    await runWorkflow(() => productApi.publish(product!.productId), "Đã xuất bản sản phẩm");
  };

  const toggleCategory = (categoryId: string) => {
    setCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const openCreateVariant = () => {
    setEditingVariant(null);
    setVariantDialogOpen(true);
  };

  const openEditVariant = (variant: VariantView) => {
    setEditingVariant(variant);
    setVariantDialogOpen(true);
  };

  const deactivateVariant = async (variant: VariantView) => {
    if (!window.confirm(`Vô hiệu hóa biến thể ${variant.sku}?`)) return;
    try {
      await productApi.deleteVariant(productId, variant.variantId);
      toast.success("Đã vô hiệu hóa biến thể");
      await reloadVariants();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading || !product) {
    return <div className="p-6">Đang tải sản phẩm...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="px-0" onClick={() => navigate(listPath)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại danh sách
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge kind="product" status={product.status} />
            <StatusBadge kind="public" status={product.publicStatus} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.status === "PENDING_APPROVAL" && access.approveProduct && (
            <>
              <Button onClick={() => runWorkflow(() => productApi.approve(product.productId), "Đã duyệt")}>
                Duyệt
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  runWorkflow(() => productApi.reject(product.productId, "Không đạt yêu cầu"), "Đã từ chối")
                }
              >
                Từ chối
              </Button>
            </>
          )}
          {(product.status === "APPROVED" || product.status === "PUBLISHED") && access.publishProduct && (
            <>
              {product.status !== "PUBLISHED" && (
                <Button onClick={handlePublish}>Xuất bản</Button>
              )}
              {product.status === "PUBLISHED" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    runWorkflow(() => productApi.unpublish(product.productId), "Đã ngừng xuất bản")
                  }
                >
                  Ngừng xuất bản
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="inline-flex rounded-lg border p-1">
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            activeTab === "info" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("info")}
        >
          Thông tin
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            activeTab === "variants" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("variants")}
        >
          Biến thể & tồn kho
        </button>
      </div>

      {activeTab === "info" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!access.editProduct} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!access.editProduct} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shortDescription">Mô tả ngắn</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                disabled={!access.editProduct}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <Textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!access.editProduct}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Thương hiệu</Label>
                <Select value={brandId || "none"} onValueChange={(v) => setBrandId(v === "none" ? "" : v)} disabled={!access.editProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thương hiệu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không chọn —</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.brandId} value={b.brandId}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <Select value={genderTarget || "none"} onValueChange={(v) => setGenderTarget(v === "none" ? "" : v)} disabled={!access.editProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không chọn —</SelectItem>
                    <SelectItem value="MEN">Nam</SelectItem>
                    <SelectItem value="WOMEN">Nữ</SelectItem>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                    <SelectItem value="KIDS">Trẻ em</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Danh mục</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const checked = categoryIds.includes(cat.categoryId);
                  return (
                    <button
                      key={cat.categoryId}
                      type="button"
                      disabled={!access.editProduct}
                      onClick={() => toggleCategory(cat.categoryId)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        checked ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ảnh sản phẩm</Label>
              <ImageUploader
                value={imageUrls}
                onChange={setImageUrls}
                disabled={!access.editProduct}
              />
            </div>

            {access.editProduct && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            )}
          </div>

          <div className="h-fit rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              Xem trước
            </div>
            <img
              src={imageUrls[0] || PLACEHOLDER}
              alt={name}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <p className="mt-3 font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{shortDescription}</p>
            <Link to={`/products/${slug}`} className="mt-2 inline-block text-sm text-primary hover:underline" target="_blank">
              Xem trên storefront
            </Link>
          </div>
        </div>
      )}

      {activeTab === "variants" && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {variants.filter((v) => v.status === "ACTIVE").length} biến thể đang hoạt động
            </p>
            {access.editProduct && (
              <Button onClick={openCreateVariant}>
                <Plus className="mr-1 h-4 w-4" />
                Thêm biến thể
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Màu</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Tồn</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      Chưa có biến thể. Thêm ít nhất một biến thể trước khi xuất bản.
                    </td>
                  </tr>
                ) : (
                  variants.map((variant) => (
                    <tr key={variant.variantId} className="border-t">
                      <td className="p-3 font-medium">{variant.sku}</td>
                      <td className="p-3">{variant.size}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: variant.colorHex || "#ccc" }}
                          />
                          {variant.colorName}
                        </span>
                      </td>
                      <td className="p-3">{money(variant.price)}</td>
                      <td className="p-3">
                        {variant.available ?? 0} / {variant.onHand ?? 0}
                      </td>
                      <td className="p-3">
                        <Badge variant={variant.status === "ACTIVE" ? "success" : "secondary"}>
                          {variant.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {access.editProduct && variant.status === "ACTIVE" && (
                            <>
                              <Button size="icon" variant="outline" onClick={() => openEditVariant(variant)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {access.deleteProduct && (
                                <Button size="icon" variant="outline" onClick={() => deactivateVariant(variant)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VariantFormDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        productId={productId}
        brand={selectedBrand}
        variant={editingVariant}
        inventoryBasePath={`${basePath}/inventory`}
        onSaved={reloadVariants}
      />
    </div>
  );
}
