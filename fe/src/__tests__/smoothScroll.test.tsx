import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/components/FloatingChatbot", () => ({
  FloatingChatbot: () => <div data-testid="floating-chatbot" />,
}));

vi.mock("@/services/ecommerceServices", () => ({
  money: (value: number) => `${value.toLocaleString("vi-VN")} ₫`,
  brandApi: { list: vi.fn(async () => []) },
  categoryApi: { list: vi.fn(async () => []) },
  productApi: { list: vi.fn(async () => ({ content: [], totalPages: 0, totalElements: 0 })) },
  reviewApi: {
    home: vi.fn(async () => ({ averageRating: 0, totalReviews: 0, recent: [] })),
    list: vi.fn(async () => ({ content: [], totalPages: 0, totalElements: 0 })),
  },
  cartApi: {
    get: vi.fn(async () => ({ items: [] })),
    validate: vi.fn(async () => ({ valid: true, issues: [] })),
  },
  checkoutApi: {
    preview: vi.fn(async () => ({ shippingFee: 0, grandTotal: 0 })),
  },
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ refresh: vi.fn(async () => {}) }),
}));

import {
  createSmoothScrollSession,
  nativeScrollTo,
  shouldPreventLenis,
  SmoothScrollProvider,
  useSmoothScroll,
  type LenisLike,
} from "@/providers/SmoothScrollProvider";
import {
  BackToTopButton,
  ScrollProgressBar,
  ScrollReveal,
  ScrollStagger,
  ScrollStaggerItem,
} from "@/components/motion/ScrollReveal";
import { HeaderSearchDropdown } from "@/components/layouts/Public/Header/components/HeaderSearch";
import AboutPage from "@/pages/Public/About/AboutPage";
import ContactPage from "@/pages/Public/Contact/ContactPage";
import BrandsPage from "@/pages/Public/Brands/BrandsPage";
import CategoriesPage from "@/pages/Public/Categories/CategoriesPage";
import ReviewsPage from "@/pages/Public/Reviews/ReviewsPage";
import CartPage from "@/pages/ecommerce/CartPage";
import RootLayout from "@/layouts/RootLayout";

type MediaChangeListener = (event: MediaQueryListEvent) => void;

function installWindowMock(options: {
  reducedMotion?: boolean;
  scrollY?: number;
}) {
  const listeners = new Set<MediaChangeListener>();
  let matches = Boolean(options.reducedMotion);
  let rafSeq = 0;
  const rafQueue = new Map<number, FrameRequestCallback>();

  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_type: string, listener: MediaChangeListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: MediaChangeListener) => {
      listeners.delete(listener);
    }),
  };

  const scrollTo = vi.fn();
  const requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    rafSeq += 1;
    rafQueue.set(rafSeq, cb);
    return rafSeq;
  });
  const cancelAnimationFrame = vi.fn((id: number) => {
    rafQueue.delete(id);
  });
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  vi.stubGlobal("window", {
    scrollY: options.scrollY ?? 0,
    scrollTo,
    matchMedia: vi.fn(() => mediaQuery),
    requestAnimationFrame,
    cancelAnimationFrame,
    addEventListener,
    removeEventListener,
  });

  return {
    mediaQuery,
    scrollTo,
    requestAnimationFrame,
    cancelAnimationFrame,
    emitReducedMotionChange(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
    flushNextRaf(time = 16) {
      const first = rafQueue.entries().next();
      if (first.done) return false;
      const [id, cb] = first.value;
      rafQueue.delete(id);
      cb(time);
      return true;
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SmoothScrollProvider & session lifecycle", () => {
  it("instantiates Lenis, drives RAF loop, and destroys cleanly on unmount", () => {
    const win = installWindowMock({ reducedMotion: false });
    const destroy = vi.fn();
    const raf = vi.fn();
    const lenisScrollTo = vi.fn();
    const mockLenis: LenisLike = { raf, scrollTo: lenisScrollTo, destroy };
    const createLenis = vi.fn(() => mockLenis);
    const onInstanceChange = vi.fn();
    const onReducedMotionChange = vi.fn();

    const cleanup = createSmoothScrollSession({
      createLenis,
      onInstanceChange,
      onReducedMotionChange,
    });

    expect(onReducedMotionChange).toHaveBeenCalledWith(false);
    expect(createLenis).toHaveBeenCalledTimes(1);
    expect(createLenis).toHaveBeenCalledWith(
      expect.objectContaining({
        lerp: 0.1,
        smoothWheel: true,
        prevent: shouldPreventLenis,
      })
    );
    expect(onInstanceChange).toHaveBeenCalledWith(mockLenis);
    expect(win.flushNextRaf(16)).toBe(true);
    expect(raf).toHaveBeenCalledWith(16);

    cleanup();

    expect(win.cancelAnimationFrame).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(onInstanceChange).toHaveBeenLastCalledWith(null);
    expect(win.listenerCount()).toBe(0);
  });

  it("skips Lenis when prefers-reduced-motion: reduce is active and destroys active instance if toggled on", () => {
    installWindowMock({ reducedMotion: true });
    const createLenis = vi.fn();

    const cleanupReduced = createSmoothScrollSession({ createLenis });
    expect(createLenis).not.toHaveBeenCalled();
    cleanupReduced();

    vi.unstubAllGlobals();
    const liveWin = installWindowMock({ reducedMotion: false });
    const destroy = vi.fn();
    const mockLenis: LenisLike = {
      raf: vi.fn(),
      scrollTo: vi.fn(),
      destroy,
    };
    const createLenisLive = vi.fn(() => mockLenis);
    const onInstanceChange = vi.fn();

    const cleanupLive = createSmoothScrollSession({
      createLenis: createLenisLive,
      onInstanceChange,
    });

    expect(createLenisLive).toHaveBeenCalledTimes(1);
    liveWin.emitReducedMotionChange(true);

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(liveWin.cancelAnimationFrame).toHaveBeenCalled();
    expect(onInstanceChange).toHaveBeenLastCalledWith(null);

    cleanupLive();
  });

  it("ignores nested scrollable containers via shouldPreventLenis", () => {
    const makeNode = (matchedSelector: string | null) =>
      ({
        closest: (selector: string) =>
          matchedSelector && selector.includes(matchedSelector) ? {} : null,
      }) as unknown as HTMLElement;

    expect(shouldPreventLenis(makeNode("[data-lenis-prevent]"))).toBe(true);
    expect(shouldPreventLenis(makeNode('[role="dialog"]'))).toBe(true);
    expect(shouldPreventLenis(makeNode(".overflow-y-auto"))).toBe(true);
    expect(shouldPreventLenis(makeNode(".overflow-auto"))).toBe(true);
    expect(shouldPreventLenis(makeNode(null))).toBe(false);
  });

  it("falls back safely to window.scrollTo outside provider and uses instant scroll for reduced motion", () => {
    const win = installWindowMock({ reducedMotion: true });

    let capturedScrollToTop: (() => void) | null = null;
    function Probe() {
      const { scrollToTop } = useSmoothScroll();
      capturedScrollToTop = () => scrollToTop();
      return <span>probe</span>;
    }

    const html = renderToStaticMarkup(<Probe />);
    expect(html).toContain("probe");
    expect(capturedScrollToTop).not.toBeNull();
    capturedScrollToTop!();

    expect(win.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });

    nativeScrollTo(480, { immediate: true });
    expect(win.scrollTo).toHaveBeenCalledWith({ top: 480, behavior: "auto" });
  });

  it("renders children inside SmoothScrollProvider", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <section>
            <h1>Hero heading</h1>
          </section>
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Hero heading");
  });
});

describe("ScrollReveal primitives & BackToTopButton", () => {
  it("renders accessible content inside ScrollReveal and ScrollStagger", () => {
    const html = renderToStaticMarkup(
      <SmoothScrollProvider>
        <ScrollReveal direction="up" delay={0.1} className="custom-reveal">
          <h2>Sản phẩm nổi bật</h2>
          <a href="/products">Xem catalog</a>
        </ScrollReveal>
        <ScrollStagger className="grid">
          <ScrollStaggerItem>
            <article>Nike Dunk Low</article>
          </ScrollStaggerItem>
        </ScrollStagger>
        <ScrollProgressBar />
      </SmoothScrollProvider>
    );

    expect(html).toContain("Sản phẩm nổi bật");
    expect(html).toContain("Xem catalog");
    expect(html).toContain("Nike Dunk Low");
    expect(html).toContain("custom-reveal");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("bg-[#E53935]");
  });

  it("hides BackToTopButton at top and renders accessible non-overlapping button past 320px", () => {
    installWindowMock({ scrollY: 120 });
    const hiddenHtml = renderToStaticMarkup(
      <SmoothScrollProvider>
        <BackToTopButton />
      </SmoothScrollProvider>
    );
    expect(hiddenHtml).toBe("");

    vi.unstubAllGlobals();
    installWindowMock({ scrollY: 420 });
    const visibleHtml = renderToStaticMarkup(
      <SmoothScrollProvider>
        <BackToTopButton />
      </SmoothScrollProvider>
    );
    expect(visibleHtml).toContain('aria-label="Lên đầu trang"');
    expect(visibleHtml).toContain("fixed bottom-6 left-6 z-40");
  });
});

describe("RootLayout scroll chrome visibility", () => {
  function renderRoute(pathname: string) {
    installWindowMock({ scrollY: 500 });
    return renderToStaticMarkup(
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="*" element={<div>Route body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  it("renders progress bar and BackToTopButton on storefront routes", () => {
    const html = renderRoute("/products");
    expect(html).toContain("bg-[#E53935]");
    expect(html).toContain('aria-label="Lên đầu trang"');
    expect(html).toContain('data-testid="floating-chatbot"');
  });

  it("hides progress bar and BackToTopButton on admin, staff, and auth routes", () => {
    for (const path of ["/admin", "/staff", "/login", "/register", "/forgot-password"]) {
      const html = renderRoute(path);
      expect(html).not.toContain("bg-[#E53935]");
      expect(html).not.toContain('aria-label="Lên đầu trang"');
    }
  });

  it("keeps progress bar on /ai-chat while hiding BackToTopButton", () => {
    const html = renderRoute("/ai-chat");
    expect(html).toContain("bg-[#E53935]");
    expect(html).not.toContain('aria-label="Lên đầu trang"');
    expect(html).not.toContain('data-testid="floating-chatbot"');
  });
});

describe("HeaderSearch scroll containment & public/storefront reveal rendering", () => {
  it("renders HeaderSearchDropdown suggestion list with data-lenis-prevent and overscroll-contain", () => {
    const html = renderToStaticMarkup(
      <HeaderSearchDropdown
        id="header-search-listbox"
        query="jordan"
        loading={false}
        suggestions={[
          {
            productId: "prod-1",
            name: "Air Jordan 1 Retro High",
            slug: "air-jordan-1-retro-high",
            brandName: "Jordan",
            categoryIds: [],
            status: "PUBLISHED",
            publicStatus: "PUBLISHED",
            minPrice: 4500000,
            imageUrls: ["https://example.com/aj1.png"],
          },
        ]}
        onSelectProduct={vi.fn()}
        onViewAll={vi.fn()}
      />
    );

    expect(html).toContain('role="listbox"');
    expect(html).toContain('data-lenis-prevent="true"');
    expect(html).toContain("overscroll-contain");
    expect(html).toContain("max-h-[360px] overflow-y-auto");
    expect(html).toContain("Air Jordan 1 Retro High");
  });

  it("renders public and cart pages with immediately visible primary headings", () => {
    const aboutHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <AboutPage />
        </SmoothScrollProvider>
      </MemoryRouter>
    );
    expect(aboutHtml).toContain("SOLE — sneaker store cho người yêu giày");
    expect(aboutHtml).toContain("Chính hãng 100%");

    const contactHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <ContactPage />
        </SmoothScrollProvider>
      </MemoryRouter>
    );
    expect(contactHtml).toContain("Liên hệ SOLE");
    expect(contactHtml).toContain("Câu hỏi thường gặp");

    const brandsHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <BrandsPage />
        </SmoothScrollProvider>
      </MemoryRouter>
    );
    expect(brandsHtml).toContain("Shop by brand");

    const categoriesHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <CategoriesPage />
        </SmoothScrollProvider>
      </MemoryRouter>
    );
    expect(categoriesHtml).toContain("Danh mục sneaker");

    const reviewsHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <ReviewsPage />
        </SmoothScrollProvider>
      </MemoryRouter>
    );
    expect(reviewsHtml).toContain("Tất cả đánh giá");
    expect(reviewsHtml).toContain('id="reviews-list"');

    const cartHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <CartPage />
        </SmoothScrollProvider>
      </MemoryRouter>
    );
    expect(cartHtml).toContain('<h1 class="text-4xl font-bold">Giỏ hàng</h1>');
    expect(cartHtml).toContain('<h2 class="text-2xl font-bold">Giỏ hàng trống</h2>');
  });
});
