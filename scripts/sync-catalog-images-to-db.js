// Sync product + variant imageUrls from slug → URL map (matches CatalogSeedService).
// Usage: docker exec -i sole-mongodb mongosh sole_ecommerce --quiet < scripts/sync-catalog-images-to-db.js

const imageBySlug = {
  "adidas-ultraboost-22":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073364/ecommerce/products/l6fjll9mmq2vb1ofljoa.webp",
  "new-balance-550":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073544/ecommerce/products/ylqdvyfhcwjpilfjvdmd.webp",
  "air-jordan-1-retro-high":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073595/ecommerce/products/cxjaeaueajj4nnnlhz3m.webp",
  "converse-chuck-70-high":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073630/ecommerce/products/vuydcwilydktiiymnjyx.webp",
  "adidas-samba-og":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073666/ecommerce/products/hwm8yd0t6kr3535oprhd.webp",
  "asics-gel-kayano-14":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073704/ecommerce/products/lgov2lv9bdzlpfbr5ze7.webp",
  "nike-air-force-1-07":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073841/ecommerce/products/eimqyyf2dgryeiol7dlh.webp",
  "new-balance-2002r":
    "https://res.cloudinary.com/dav7n3cu7/image/upload/v1788073890/ecommerce/products/hhs9banvlpeieujyynqs.png",
};

const now = new Date();
let productsUpdated = 0;
let variantsUpdated = 0;

for (const [slug, url] of Object.entries(imageBySlug)) {
  const product = db.products.findOne({ slug });
  if (!product) {
    print(`skip missing slug: ${slug}`);
    continue;
  }
  const productId = product.productId || product._id.toString();
  const imageUrls = [url];

  db.products.updateOne({ slug }, { $set: { imageUrls, updated_at: now } });
  productsUpdated++;

  const variantResult = db.product_variants.updateMany(
    { productId },
    { $set: { imageUrls, updated_at: now } }
  );
  variantsUpdated += variantResult.modifiedCount;
  print(`${slug} → ${url.substring(0, 72)}… (${variantResult.modifiedCount} variants)`);
}

print(`Done: ${productsUpdated} products, ${variantsUpdated} variants updated.`);

// Category hero images — same product slugs as CatalogSeedService.CATEGORY_HERO_PRODUCT
const categoryHeroProduct = {
  running: "adidas-ultraboost-22",
  lifestyle: "adidas-samba-og",
  basketball: "air-jordan-1-retro-high",
  skate: "vans-old-skool",
  trail: "asics-gel-kayano-14",
  kids: "converse-chuck-70-high",
};

const unsplashFallback = {
  "nike-air-max-90":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  "vans-old-skool":
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
};

function resolveProductImage(slug) {
  if (imageBySlug[slug]) return imageBySlug[slug];
  const product = db.products.findOne({ slug }, { imageUrls: 1 });
  if (product?.imageUrls?.[0]) return product.imageUrls[0];
  if (unsplashFallback[slug]) return unsplashFallback[slug];
  return null;
}

let categoriesUpdated = 0;
for (const [categorySlug, productSlug] of Object.entries(categoryHeroProduct)) {
  const imageUrl = resolveProductImage(productSlug);
  if (!imageUrl) {
    print(`skip category ${categorySlug} — no image for product ${productSlug}`);
    continue;
  }
  const result = db.categories.updateOne(
    { slug: categorySlug },
    { $set: { imageUrl, updated_at: now } }
  );
  if (result.matchedCount > 0) {
    categoriesUpdated++;
    print(`category ${categorySlug} ← ${productSlug} (${imageUrl.substring(0, 72)}…)`);
  }
}
print(`Done: ${categoriesUpdated} categories updated.`);
