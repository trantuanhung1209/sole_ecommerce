import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductReviewsSection } from "@/components/ecommerce/ProductReviewsSection";
import { StarRating } from "@/components/ecommerce/StarRating";
import {
  brandApi,
  cartApi,
  categoryApi,
  money,
  productApi,
  reviewApi,
  wishlistApi,
} from "@/services/ecommerceServices";
import type { Brand, Category, Product, ProductSummary, ProductVariant } from "@/types/ecommerce.type";
import { ProductCard } from "@/components/home/ProductCard";

const fallback = "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80";

const GENDER_LABELS: Record<string, string> = {
  MEN: "Nam",
  WOMEN: "Nữ",
  UNISEX: "Unisex",
  KIDS: "Trẻ em",
};

export default function ProductDetailPage() {
  const { idOrSlug = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    Promise.all([brandApi.list(), categoryApi.list()]).then(([brandList, categoryList]) => {
      setBrands(brandList);
      setCategories(categoryList);
    });
  }, []);

  useEffect(() => {
    productApi.detail(idOrSlug).then((data) => {
      setProduct(data);
      productApi.variants(data.productId).then((items) => {
        const active = items.filter((v) => v.status === "ACTIVE");
        setVariants(active);
        const colors = [...new Set(active.map((v) => v.colorName))];
        const firstColor = colors[0] || "";
        setSelectedColor(firstColor);
        const sizesForColor = active
          .filter((v) => v.colorName === firstColor && (v.available ?? 1) > 0)
          .map((v) => v.size);
        setSelectedSize(sizesForColor[0] || active.find((v) => v.colorName === firstColor)?.size || "");
      });
      reviewApi.listByProduct(data.productId, 0, 50).then((result) => {
        setReviewCount(result.totalElements);
        if (result.content.length > 0) {
          const avg =
            result.content.reduce((sum, review) => sum + (review.rating || 0), 0) / result.content.length;
          setReviewAverage(avg);
        } else {
          setReviewAverage(0);
        }
      });
      productApi.related(data.productId, 8).then(setRelatedProducts).catch(() => setRelatedProducts([]));
    });
  }, [idOrSlug]);

  const brand = useMemo(
    () => brands.find((item) => item.brandId === product?.brandId),
    [brands, product?.brandId]
  );

  const productCategories = useMemo(
    () => categories.filter((cat) => product?.categoryIds?.includes(cat.categoryId)),
    [categories, product?.categoryIds]
  );

  const colors = useMemo(() => [...new Set(variants.map((v) => v.colorName))], [variants]);

  const sizesForColor = useMemo(
    () => variants.filter((v) => v.colorName === selectedColor),
    [selectedColor, variants]
  );

    () => variants.find((v) => v.colorName === selectedColor && v.size === selectedSize),
    [selectedColor, selectedSize, variants]
  );

  const available = selected?.available ?? 0;

  const galleryImages = useMemo(() => {
    if (selected?.imageUrls?.length) return selected.imageUrls;
    if (product?.imageUrls?.length) return product.imageUrls;
    return [fallback];
  }, [product?.imageUrls, selected?.imageUrls]);

  const minPrice = useMemo(() => {
    const prices = variants.map((v) => v.price).filter((p) => p > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [variants]);

  const hasDiscount =
    selected?.compareAtPrice != null &&
    selected.compareAtPrice > (selected.price || 0);

  const outOfStock = variants.every((v) => (v.available ?? 0) <= 0);

  useEffect(() => {
    setActiveImage(0);
  }, [galleryImages]);

  useEffect(() => {
    setQuantity(1);
  }, [selected?.variantId]);

  useEffect(() => {
    if (quantity > available && available > 0) {
      setQuantity(available);
    }
  }, [available, quantity]);

  if (!product) {
    return <main className="min-h-screen bg-[#F7F7F5] p-8">Đang tải sản phẩm...</main>;
  }

  const addToWishlist = async () => {
    await wishlistApi.add(product.productId);
    toast.success("Đã thêm vào yêu thích");
  };

  const addToCart = async (qty = quantity) => {
    if (!selected) {
      toast.error("Vui lòng chọn màu và size");
      return;
    }
    if ((selected.available ?? 0) <= 0) {
      toast.error("Size này đã hết hàng");
      return;
    }
    await cartApi.add(selected.variantId, qty);
    toast.success("Đã thêm vào giỏ hàng");
  };

  const buyNow = async () => {
    if (!selected || (selected.available ?? 0) <= 0) {
      toast.error("Vui lòng chọn size còn hàng");
      return;
    }
    await cartApi.add(selected.variantId, quantity);
    navigate("/checkout");
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const firstAvailable = variants.find((v) => v.colorName === color && (v.available ?? 0) > 0);
    setSelectedSize(firstAvailable?.size || variants.find((v) => v.colorName === color)?.size || "");
  };

  const specs = [
    { label: "Thương hiệu", value: brand?.name },
    { label: "Danh mục", value: productCategories.map((c) => c.name).join(", ") || undefined },
    { label: "Giới tính", value: product.genderTarget ? GENDER_LABELS[product.genderTarget] : undefined },
    { label: "Chất liệu", value: product.material },
    { label: "SKU", value: selected?.sku },
    { label: "Màu đang chọn", value: selected?.colorName },
    { label: "Size đang chọn", value: selected?.size },
  ].filter((item) => item.value);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto grid max-w-[1240px] gap-8 px-4 py-8 md:grid-cols-[1.15fr_.85fr] md:px-5 md:py-12">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-[#F1F1EF]">
            <img
              src={galleryImages[activeImage] || fallback}
              alt={product.name}
              className="h-full w-full object-contain p-8"
            />
          </div>
          {galleryImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.slice(0, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square overflow-hidden rounded-xl border bg-white ${
                    activeImage === index ? "border-[#111111] ring-2 ring-[#111111]/20" : "border-[#E5E7EB]"
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-contain p-3" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="h-fit md:sticky md:top-24">
          {brand ? (
            <Link to={`/products?brand=${brand.slug}`} className="text-xs font-bold uppercase text-[#6B7280] hover:text-[#111111]">
              {brand.name}
            </Link>
          ) : (
            <p className="text-xs font-bold uppercase text-[#6B7280]">SOLE</p>
          )}
          <h1 className="mt-2 text-4xl font-bold">{product.name}</h1>

          {reviewCount > 0 ? (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111]">
              <StarRating rating={reviewAverage} size="sm" showValue />
              <span>({reviewCount} đánh giá)</span>
            </a>
          ) : null}

          {product.shortDescription ? (
            <p className="mt-4 text-[#6B7280]">{product.shortDescription}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="text-2xl font-bold">{money(selected?.price || minPrice || 0)}</div>
            {hasDiscount ? (
              <span className="text-sm text-[#9CA3AF] line-through">{money(selected!.compareAtPrice!)}</span>
            ) : null}
          </div>

          {outOfStock ? (
            <Badge variant="destructive" className="mt-3">
              Hết hàng
            </Badge>
          ) : null}

          {colors.length > 0 ? (
            <div className="mt-8">
              <span className="mb-3 block font-semibold">Chọn màu</span>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const variant = variants.find((v) => v.colorName === color);
                  return (
                    <button
                      key={color}
                      type="button"
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                        selectedColor === color
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-[#D1D5DB] bg-white text-[#111111]"
                      }`}
                      onClick={() => handleColorChange(color)}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full border"
                        style={{ backgroundColor: variant?.colorHex || "#ccc" }}
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">Chọn size</span>
              <Badge variant="outline">SKU {selected?.sku || "N/A"}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sizesForColor.map((variant) => {
                const size = variant.size;
                const sizeAvailable = variant.available ?? 0;
                const disabled = sizeAvailable <= 0;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    className={`h-11 rounded-lg border text-sm font-semibold ${
                      disabled
                        ? "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF] line-through"
                        : selectedSize === size
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-[#D1D5DB] bg-white text-[#111111]"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {selected && available > 0 ? (
              <p className="mt-2 text-sm text-[#6B7280]">Còn {available} sản phẩm</p>
            ) : selected ? (
              <p className="mt-2 text-sm text-red-600">Size này đã hết hàng</p>
            ) : null}
          </div>

          {available > 0 ? (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-semibold">Số lượng</span>
              <Button variant="outline" size="icon" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button variant="outline" size="icon" disabled={quantity >= available} onClick={() => setQuantity((q) => q + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          <div className="mt-8 flex gap-3">
            <Button
              className="h-12 flex-1 rounded-lg bg-[#111111] text-white"
              onClick={() => addToCart()}
              disabled={outOfStock || !selected || available <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
              Thêm vào giỏ
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-lg border-[#111111]"
              onClick={buyNow}
              disabled={outOfStock || !selected || available <= 0}
            >
              Mua ngay
            </Button>
            <Button variant="outline" className="h-12 rounded-lg border-[#D1D5DB] bg-white" onClick={addToWishlist}>
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-[1240px] space-y-6 px-4 pb-12 md:px-5">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 md:p-8">
            <h2 className="text-xl font-bold">Mô tả sản phẩm</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#374151]">
              {product.description || product.shortDescription || "Chưa có mô tả chi tiết cho sản phẩm này."}
            </p>
            {product.careInstruction ? (
              <div className="mt-6 rounded-xl bg-[#F7F7F5] p-4">
                <h3 className="font-semibold">Hướng dẫn bảo quản</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-[#6B7280]">{product.careInstruction}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 md:p-8">
            <h2 className="text-xl font-bold">Thông tin chi tiết</h2>
            {specs.length > 0 ? (
              <dl className="mt-4 divide-y divide-[#E5E7EB]">
                {specs.map((item) => (
                  <div key={item.label} className="grid grid-cols-[140px_1fr] gap-3 py-3 text-sm">
                    <dt className="font-medium text-[#6B7280]">{item.label}</dt>
                    <dd className="font-semibold text-[#111111]">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-[#6B7280]">Chưa có thông tin bổ sung.</p>
            )}
          </div>
        </div>

        <div id="reviews">
          <ProductReviewsSection productId={product.productId} />
        </div>

        {relatedProducts.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold">Sản phẩm liên quan</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item.productId} product={item} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
