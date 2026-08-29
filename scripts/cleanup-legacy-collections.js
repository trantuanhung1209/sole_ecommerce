// MongoDB cleanup: remove legacy tour collections (run after backup)
// Run: mongosh <connection-uri> scripts/cleanup-legacy-collections.js

const legacyCollections = [
  "tours",
  "destinations",
  "schedules",
  "bookings",
  "booking_change_requests",
  "refund_requests",
  "reviews",
  "payments",
  "chat_conversations",
];

legacyCollections.forEach((name) => {
  if (db.getCollectionNames().includes(name)) {
    db[name].drop();
    print("Dropped collection: " + name);
  } else {
    print("Skipped missing collection: " + name);
  }
});

print("Legacy collection cleanup complete");
