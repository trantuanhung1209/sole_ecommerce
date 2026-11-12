import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layouts/Public/Header/Header", () => ({
  default: () => <header data-testid="public-header">SOLE Header</header>,
}));

vi.mock("@/services/ecommerceServices", () => ({
  money: (value: number) => `${value.toLocaleString("vi-VN")} ₫`,
  aiApi: {
    chat: vi.fn(),
    chatVoice: vi.fn(),
    chatImage: vi.fn(),
  },
}));

import DefaultLayout from "@/layouts/DefaultLayout";
import AiChatPage from "@/pages/ecommerce/AiChatPage";

function renderDefaultLayoutAt(pathname: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path="/products" element={<div>Products page</div>} />
          <Route path="/ai-chat" element={<AiChatPage />} />
          <Route path="*" element={<div>Storefront page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("DefaultLayout Footer visibility on /ai-chat", () => {
  it("renders Footer on /products and other storefront routes", () => {
    const productsHtml = renderDefaultLayoutAt("/products");
    expect(productsHtml).toContain('data-testid="public-header"');
    expect(productsHtml).toContain("Products page");
    expect(productsHtml).toContain("<footer");
    expect(productsHtml).toContain('aria-label="Footer navigation"');
  });

  it("omits Footer on /ai-chat so chat never overlaps the footer", () => {
    const aiChatHtml = renderDefaultLayoutAt("/ai-chat");
    expect(aiChatHtml).toContain('data-testid="public-header"');
    expect(aiChatHtml).toContain("Trợ lý AI SOLE");
    expect(aiChatHtml).not.toContain("<footer");
    expect(aiChatHtml).not.toContain('aria-label="Footer navigation"');
  });
});

describe("AiChatPage viewport layout and scroll containment", () => {
  it("renders inside a flex viewport container without fixed bottom-0 positioning", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ai-chat"]}>
        <AiChatPage />
      </MemoryRouter>
    );

    expect(html).toContain("h-[calc(100dvh-4rem)]");
    expect(html).toContain("lg:h-[calc(100dvh-4.5rem)]");
    expect(html).not.toContain("fixed inset-x-0 bottom-0");
    expect(html).not.toContain("bottom-0 top-16");
  });

  it("includes data-lenis-prevent and overscroll-contain on the scrollable message list", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ai-chat"]}>
        <AiChatPage />
      </MemoryRouter>
    );

    expect(html).toContain('data-lenis-prevent="true"');
    expect(html).toContain("overscroll-contain");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("Xin chào! Tôi là trợ lý SOLE.");
    expect(html).toContain('placeholder="Nhập câu hỏi..."');
  });
});
