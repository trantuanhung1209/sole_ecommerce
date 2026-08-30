// Export product image URLs from MongoDB (for updating CatalogSeedService manually).
// Usage: docker exec sole-mongodb mongosh sole_ecommerce --quiet --file scripts/pull-catalog-seed-from-db.js

print("// Product image URLs from DB — paste into CatalogSeedService.catalogProducts()");
db.products
  .find({}, { _id: 0, slug: 1, name: 1, imageUrls: 1 })
  .sort({ slug: 1 })
  .forEach((p) => {
    const url = p.imageUrls?.[0] ?? "";
    print(`${p.slug}\t${url}`);
  });

print("\n// Categories");
db.categories
  .find({}, { _id: 0, slug: 1, name: 1, imageUrl: 1 })
  .sort({ slug: 1 })
  .forEach((c) => {
    print(`${c.slug}\t${c.imageUrl ?? ""}`);
  });
