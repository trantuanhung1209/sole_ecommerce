import type { Category, Product } from "@/types/ecommerce.type";

/** Matches CatalogSeedService.CATEGORY_HERO_PRODUCT — representative shoe per category. */
export const CATEGORY_HERO_PRODUCT: Record<string, string> = {
  running: "adidas-ultraboost-22",
  lifestyle: "adidas-samba-og",
  basketball: "air-jordan-1-retro-high",
  skate: "vans-old-skool",
  trail: "asics-gel-kayano-14",
  kids: "converse-chuck-70-high",
};

export const DEFAULT_CATEGORY_IMAGE =
  "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073364/ecommerce/products/l6fjll9mmq2vb1ofljoa.webp";

type ProductImageSource = Pick<Product, "slug" | "categoryIds" | "imageUrls">;

export function resolveCategoryImageUrl(
  category: Pick<Category, "categoryId" | "slug" | "imageUrl">,
  products: ProductImageSource[] = []
): string {
  const heroSlug = CATEGORY_HERO_PRODUCT[category.slug];
  if (heroSlug) {
    const hero = products.find((p) => p.slug === heroSlug);
    if (hero?.imageUrls?.[0]) return hero.imageUrls[0];
  }

  const inCategory = products.find(
    (p) => p.categoryIds?.includes(category.categoryId) && p.imageUrls?.[0]
  );
  if (inCategory?.imageUrls?.[0]) return inCategory.imageUrls[0];

  if (category.imageUrl?.includes("res.cloudinary.com")) {
    return category.imageUrl;
  }

  return DEFAULT_CATEGORY_IMAGE;
}
