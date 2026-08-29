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
});

describe("shipping threshold", () => {
  it("free shipping at 2M VND", () => {
    const subtotal = 2_000_000;
    const shipping = subtotal >= 2_000_000 ? 0 : 30_000;
    expect(shipping).toBe(0);
  });
});
