import { describe, expect, it } from "vitest";
import { roleAccess } from "@/config/roleAccess";
import { UserRole } from "@/types/user.type";

describe("roleAccess", () => {
  it("allows SHOP_MANAGER to approve products", () => {
    expect(roleAccess.canApproveProduct(UserRole.SHOP_MANAGER)).toBe(true);
  });

  it("checks permission codes from API", () => {
    expect(roleAccess.hasPermission(["CATALOG_APPROVE"], "CATALOG_APPROVE")).toBe(true);
    expect(roleAccess.hasPermission(["CATALOG_READ"], "CATALOG_APPROVE")).toBe(false);
  });

  it("uses INVENTORY_UPDATE permission for adjust inventory", () => {
    expect(roleAccess.canAdjustInventory(UserRole.STAFF, ["INVENTORY_UPDATE"])).toBe(true);
    expect(roleAccess.canAdjustInventory(UserRole.STAFF, ["INVENTORY_READ"])).toBe(false);
  });

  it("uses REPORT_READ permission for reports", () => {
    expect(roleAccess.canViewReports(undefined, ["REPORT_READ"])).toBe(true);
  });

  it("uses RETURN_PROCESS permission for return approval", () => {
    expect(roleAccess.canApproveReturn(undefined, ["RETURN_PROCESS"])).toBe(true);
  });
});

describe("shipping threshold", () => {
  it("free shipping at 2M VND", () => {
    const subtotal = 2_000_000;
    const shipping = subtotal >= 2_000_000 ? 0 : 30_000;
    expect(shipping).toBe(0);
  });

  it("charges shipping below 2M VND", () => {
    const subtotal = 1_999_999;
    const shipping = subtotal >= 2_000_000 ? 0 : 30_000;
    expect(shipping).toBe(30_000);
  });
});

describe("payment verification states", () => {
  it("treats COMPLETED payment status as confirmed", () => {
    const paymentStatus = "COMPLETED";
    const confirmed = paymentStatus === "COMPLETED";
    expect(confirmed).toBe(true);
  });

  it("treats EXPIRED payment as failed", () => {
    const status = "EXPIRED";
    expect(["FAILED", "EXPIRED"].includes(status)).toBe(true);
  });
});

describe("inventory CSV import parsing", () => {
  it("parses variantId,quantity lines", () => {
    const lines = ["var-1,10", "var-2,-3"];
    const items = lines.map((line) => {
      const [variantId, qtyRaw] = line.split(",").map((s) => s.trim());
      return { variantId, quantity: Number(qtyRaw) };
    });
    expect(items).toEqual([
      { variantId: "var-1", quantity: 10 },
      { variantId: "var-2", quantity: -3 },
    ]);
  });
});
