import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Footer, {
  scrollFooterToTop,
  validateNewsletterEmail,
} from "@/components/layouts/Public/Footer/Footer";

function renderFooterHtml(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe("Footer", () => {
  it("renders semantic contentinfo landmark and footer navigation", () => {
    const html = renderFooterHtml();
    expect(html).toContain("<footer");
    expect(html).toContain('aria-label="Footer navigation"');
  });

  it("renders SOLE branding, tagline, service highlights, and payment badges", () => {
    const html = renderFooterHtml();
    expect(html).toContain("SOLE");
    expect(html).toContain("Sneaker chính hãng — Streetwear &amp; Running Culture");
    expect(html).toContain("Authentic 100%");
    expect(html).toContain("Đổi size 7 ngày");
    expect(html).toContain("Giao nhanh toàn quốc");
    expect(html).toContain("COD");
    expect(html).toContain("SePay QR");
    expect(html).toContain("Visa/Mastercard");
  });

  it("renders valid navigation Link paths without a Giỏ hàng heading", () => {
    const html = renderFooterHtml();
    const expectedPaths = [
      "/products",
      "/new-arrivals",
      "/categories",
      "/brands",
      "/ai-chat",
      "/orders",
      "/returns",
      "/cart",
      "/reviews",
      "/about",
      "/contact",
    ];

    for (const path of expectedPaths) {
      expect(html).toContain(`href="${path}"`);
    }

    const headingMatches = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) ?? [];
    for (const heading of headingMatches) {
      expect(heading).not.toMatch(/Giỏ hàng/i);
    }
    expect(html).toMatch(/<a[^>]*href="\/cart"[^>]*>Giỏ hàng<\/a>/);
  });

  it("renders newsletter form and back-to-top button", () => {
    const html = renderFooterHtml();
    expect(html).toContain("Nhận tin Drop mới");
    expect(html).toContain('id="footer-newsletter-email"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="submit"');
    expect(html).toContain("Về đầu trang");
  });
});

describe("validateNewsletterEmail", () => {
  it("rejects empty or whitespace-only input", () => {
    expect(validateNewsletterEmail("")).toEqual({
      valid: false,
      error: "Vui lòng nhập địa chỉ email của bạn.",
    });
    expect(validateNewsletterEmail("   ")).toEqual({
      valid: false,
      error: "Vui lòng nhập địa chỉ email của bạn.",
    });
  });

  it("rejects malformed email addresses", () => {
    expect(validateNewsletterEmail("invalid-email")).toEqual({
      valid: false,
      error: "Địa chỉ email chưa đúng định dạng.",
    });
    expect(validateNewsletterEmail("user@domain")).toEqual({
      valid: false,
      error: "Địa chỉ email chưa đúng định dạng.",
    });
  });

  it("accepts and trims valid email addresses", () => {
    expect(validateNewsletterEmail("  sneakerhead@sole.vn  ")).toEqual({
      valid: true,
      normalizedEmail: "sneakerhead@sole.vn",
    });
  });
});

describe("scrollFooterToTop", () => {
  it("uses smooth scroll when prefers-reduced-motion is not reduce", () => {
    const scrollTo = vi.fn();
    const matchMedia = vi.fn().mockReturnValue({ matches: false });

    const behavior = scrollFooterToTop({ scrollTo, matchMedia });

    expect(behavior).toBe("smooth");
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("uses auto scroll when prefers-reduced-motion is reduce", () => {
    const scrollTo = vi.fn();
    const matchMedia = vi.fn().mockReturnValue({ matches: true });

    const behavior = scrollFooterToTop({ scrollTo, matchMedia });

    expect(behavior).toBe("auto");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("returns null safely when window is unavailable", () => {
    expect(scrollFooterToTop(undefined)).toBeNull();
  });
});
