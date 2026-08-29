import { test, expect } from "@playwright/test";

test.describe("SOLE smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Sản phẩm|products/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test("products list accessible", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("main")).toBeVisible();
  });

  test("guest can open cart page", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Giỏ hàng/i })).toBeVisible();
  });
});
