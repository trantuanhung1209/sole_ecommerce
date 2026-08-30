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
