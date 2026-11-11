import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/ecommerceServices", () => ({
  money: (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount),
  wishlistApi: {
    list: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  productApi: {
    detail: vi.fn(),
  },
  returnApi: {
    mine: vi.fn().mockResolvedValue([]),
  },
  reviewApi: {
    mine: vi.fn().mockResolvedValue([]),
  },
  orderApi: {
    mine: vi.fn().mockResolvedValue({
      content: [],
      page: 0,
      size: 6,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }),
  },
}));

vi.mock("@/services/notificationServices", () => ({
  notificationApi: {
    list: vi.fn().mockResolvedValue({
      content: [],
      page: 0,
      size: 8,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }),
    markRead: vi.fn().mockResolvedValue(undefined),
    markAllRead: vi.fn().mockResolvedValue(undefined),
  },
}));

import {
  clampPage,
  getPaginationItems,
  paginateItems,
  TablePagination,
} from "@/components/shared/TablePagination";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";
import WishlistPage, { WISHLIST_PAGE_SIZE } from "@/pages/ecommerce/WishlistPage";
import MyReturnsPage, { MY_RETURNS_PAGE_SIZE } from "@/pages/ecommerce/MyReturnsPage";
import MyReviewsPage, { MY_REVIEWS_PAGE_SIZE } from "@/pages/ecommerce/MyReviewsPage";
import OrderHistoryPage, { ORDER_HISTORY_PAGE_SIZE } from "@/pages/ecommerce/OrderHistoryPage";
import NotificationsPage, { NOTIFICATIONS_PAGE_SIZE } from "@/pages/ecommerce/NotificationsPage";

function renderWithProviders(element: React.ReactElement, initialEntry = "/") {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SmoothScrollProvider>{element}</SmoothScrollProvider>
    </MemoryRouter>
  );
}

describe("TablePagination numbered buttons, ellipsis & accessibility", () => {
  it("returns empty markup when totalPages <= 1", () => {
    expect(
      renderToStaticMarkup(
        <TablePagination page={0} totalPages={1} totalElements={4} onPageChange={vi.fn()} />
      )
    ).toBe("");
    expect(
      renderToStaticMarkup(
        <TablePagination page={0} totalPages={0} totalElements={0} onPageChange={vi.fn()} />
      )
    ).toBe("");
  });

  it("renders numbered page buttons, aria-current on active page, and Trước/Sau controls", () => {
    const html = renderToStaticMarkup(
      <TablePagination page={0} totalPages={4} totalElements={22} onPageChange={vi.fn()} />
    );

    expect(html).toContain('aria-label="Phân trang"');
    expect(html).toContain("Tổng 22 mục · Trang 1 / 4");
    expect(html).toContain('aria-label="Trang trước"');
    expect(html).toContain('aria-label="Trang sau"');
    expect(html).toContain('aria-label="Trang 1" aria-current="page"');
    expect(html).toContain('aria-label="Trang 2"');
    expect(html).toContain('aria-label="Trang 4"');
    expect(html).not.toContain("…");
  });

  it("computes smart ellipsis sequences without single-page gaps", () => {
    expect(getPaginationItems(0, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(getPaginationItems(0, 12)).toEqual([0, 1, 2, 3, "ellipsis", 11]);
    expect(getPaginationItems(5, 12)).toEqual([0, "ellipsis", 4, 5, 6, "ellipsis", 11]);
    expect(getPaginationItems(10, 12)).toEqual([0, "ellipsis", 8, 9, 10, 11]);
    expect(getPaginationItems(3, 8)).toEqual([0, 1, 2, 3, 4, "ellipsis", 7]);
    expect(getPaginationItems(4, 8)).toEqual([0, "ellipsis", 3, 4, 5, 6, 7]);
  });

  it("renders ellipsis spans in HTML when totalPages > 7", () => {
    const html = renderToStaticMarkup(
      <TablePagination page={5} totalPages={12} totalElements={72} onPageChange={vi.fn()} />
    );

    expect(html).toContain("Tổng 72 mục · Trang 6 / 12");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(">6<");
    expect(html).toContain(">1<");
    expect(html).toContain(">12<");
    expect((html.match(/…/g) ?? []).length).toBe(2);
  });
});

describe("clampPage & paginateItems helpers", () => {
  it("slices pages accurately and clamps out-of-range or post-delete page indices", () => {
    const items = Array.from({ length: 13 }, (_, idx) => `item-${idx + 1}`);

    const page1 = paginateItems(items, 0, 6);
    expect(page1.items).toEqual(["item-1", "item-2", "item-3", "item-4", "item-5", "item-6"]);
    expect(page1.totalPages).toBe(3);
    expect(page1.page).toBe(0);

    const page3 = paginateItems(items, 2, 6);
    expect(page3.items).toEqual(["item-13"]);
    expect(page3.page).toBe(2);

    // Simulate removing the last item on page 3 ("item-13"): remaining 12 items => 2 pages => page 2 clamps to 1.
    const afterDelete = paginateItems(items.slice(0, 12), 2, 6);
    expect(afterDelete.totalPages).toBe(2);
    expect(afterDelete.page).toBe(1);
    expect(afterDelete.items).toEqual([
      "item-7",
      "item-8",
      "item-9",
      "item-10",
      "item-11",
      "item-12",
    ]);

    expect(clampPage(-3, 4)).toBe(0);
    expect(clampPage(9, 4)).toBe(3);
    expect(clampPage(1, 0)).toBe(0);
  });
});

describe("Customer & private storefront list pages pagination configuration", () => {
  it("uses expected page sizes across Wishlist, MyReturns, MyReviews, OrderHistory, and Notifications", () => {
    expect(WISHLIST_PAGE_SIZE).toBe(6);
    expect(MY_RETURNS_PAGE_SIZE).toBe(6);
    expect(MY_REVIEWS_PAGE_SIZE).toBe(6);
    expect(ORDER_HISTORY_PAGE_SIZE).toBe(6);
    expect(NOTIFICATIONS_PAGE_SIZE).toBe(8);
  });

  it("renders WishlistPage, MyReturnsPage, MyReviewsPage, OrderHistoryPage, and NotificationsPage cleanly", () => {
    const wishlistHtml = renderWithProviders(<WishlistPage />, "/wishlist");
    expect(wishlistHtml).toContain("Wishlist");

    const returnsHtml = renderWithProviders(<MyReturnsPage />, "/returns");
    expect(returnsHtml).toContain("Yêu cầu trả hàng");
    expect(returnsHtml).toContain("Bạn chưa có yêu cầu trả hàng nào.");

    const reviewsHtml = renderWithProviders(<MyReviewsPage />, "/my-reviews");
    expect(reviewsHtml).toContain("Đánh giá của tôi");
    expect(reviewsHtml).toContain("Bạn chưa viết đánh giá nào.");

    const ordersHtml = renderWithProviders(<OrderHistoryPage />, "/orders");
    expect(ordersHtml).toContain("Đơn hàng của tôi");
    expect(ordersHtml).toContain("Bạn chưa có đơn hàng nào.");

    const notificationsHtml = renderWithProviders(<NotificationsPage />, "/notifications");
    expect(notificationsHtml).toContain("Thông báo");
    expect(notificationsHtml).toContain("Đang tải...");
  });
});
