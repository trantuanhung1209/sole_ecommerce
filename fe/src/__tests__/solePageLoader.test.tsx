import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserRole, type User } from "@/types/user.type";

let mockAuthState: {
  user: User | null;
  loading: boolean;
  isLoggedIn?: boolean;
} = {
  user: null,
  loading: true,
  isLoggedIn: false,
};

vi.mock("@/hooks/useRedux", () => ({
  useAppSelector: (
    selector: (state: { auth: typeof mockAuthState }) => unknown
  ) => selector({ auth: mockAuthState }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock("@/store/slices", () => ({
  fetchProfile: vi.fn(() => ({ type: "auth/fetchProfile" })),
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    addItem: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/useRoleAccess", () => ({
  useRoleAccess: () => ({
    role: UserRole.ADMIN,
    canManageVariants: () => true,
    access: {
      manageOrders: true,
      editProduct: true,
      approveProduct: true,
      publishProduct: true,
      deleteProduct: true,
      processReturnStaff: true,
      approveReturn: true,
    },
  }),
}));

vi.mock("@/services/ecommerceServices", () => ({
  money: (value: number) => `${value.toLocaleString("vi-VN")} ₫`,
  brandApi: { list: vi.fn(() => new Promise(() => {})) },
  categoryApi: { list: vi.fn(() => new Promise(() => {})) },
  productApi: {
    detail: vi.fn(() => new Promise(() => {})),
    variants: vi.fn(() => new Promise(() => {})),
    adminVariants: vi.fn(() => new Promise(() => {})),
    related: vi.fn(() => new Promise(() => {})),
  },
  reviewApi: {
    listByProduct: vi.fn(() => new Promise(() => {})),
  },
  wishlistApi: {
    add: vi.fn(),
  },
  orderApi: {
    detail: vi.fn(() => new Promise(() => {})),
    adminDetail: vi.fn(() => new Promise(() => {})),
  },
  paymentApi: {
    byOrder: vi.fn(() => new Promise(() => {})),
  },
  returnApi: {
    mine: vi.fn(() => new Promise(() => {})),
    detail: vi.fn(() => new Promise(() => {})),
    adminDetail: vi.fn(() => new Promise(() => {})),
  },
  mediaApi: {
    uploadImages: vi.fn(),
  },
  rbacApi: {
    matrix: vi.fn(() => new Promise(() => {})),
    auditLogs: vi.fn(() => new Promise(() => {})),
  },
}));

vi.mock("@/services/notificationServices", () => ({
  notificationApi: {
    list: vi.fn(() => new Promise(() => {})),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

vi.mock("@/pages/admin/DashboardAdmin/hooks", () => ({
  useDashboardData: () => ({
    loading: true,
    stats: {},
    orders: [],
  }),
  useDashboardCharts: () => ({
    revenueChartData: [],
    orderStatusData: [],
    productPopularityData: [],
  }),
}));

import {
  ROUTE_TRANSITION_DURATION_MS,
  RouteTransitionBar,
  SolePageLoader,
} from "@/components/shared/SolePageLoader";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";
import ProductDetailPage from "@/pages/ecommerce/ProductDetailPage";
import CategoryProductsPage from "@/pages/ecommerce/CategoryProductsPage";
import OrderDetailPage from "@/pages/ecommerce/OrderDetailPage";
import MyReturnDetailPage from "@/pages/ecommerce/MyReturnDetailPage";
import NotificationsPage from "@/pages/ecommerce/NotificationsPage";
import DashboardAdmin from "@/pages/admin/DashboardAdmin/DashboardAdmin";
import OrderDetailAdminPage from "@/pages/admin/OrderManagement/OrderDetailAdminPage";
import ProductDetailAdminPage from "@/pages/admin/ProductManagement/ProductDetailAdminPage";
import ReturnDetailAdminPage from "@/pages/admin/ReturnManagement/ReturnDetailAdminPage";
import RolePermissionsPage from "@/pages/admin/RolePermissions/RolePermissionsPage";

function installStorageAndWindowMock(options?: {
  userLoggedIn?: string | null;
  reducedMotion?: boolean;
}) {
  const store = new Map<string, string>();
  if (options?.userLoggedIn != null) {
    store.set("userLoggedIn", options.userLoggedIn);
  }

  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });

  vi.stubGlobal("window", {
    scrollY: 0,
    scrollTo: vi.fn(),
    matchMedia: vi.fn(() => ({
      matches: Boolean(options?.reducedMotion),
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    requestAnimationFrame: vi.fn(() => 1),
    cancelAnimationFrame: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SolePageLoader", () => {
  it("renders accessible status landmark, SoleLogo, default Vietnamese label, and editorial styling", () => {
    const html = renderToStaticMarkup(<SolePageLoader />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-testid="sole-page-loader"');
    expect(html).toContain('data-variant="section"');
    expect(html).toContain("SOLE");
    expect(html).toContain("Đang tải...");
    expect(html).toContain("bg-[#F7F7F5]");
    expect(html).toContain("border-[#E5E7EB]");
    expect(html).toContain("bg-[#E53935]");
  });

  it("supports custom label, fullScreen mode, and compact mode", () => {
    const fullScreenHtml = renderToStaticMarkup(
      <SolePageLoader fullScreen label="Đang xác thực phiên đăng nhập..." />
    );

    expect(fullScreenHtml).toContain('data-variant="fullscreen"');
    expect(fullScreenHtml).toContain("min-h-screen");
    expect(fullScreenHtml).toContain("Đang xác thực phiên đăng nhập...");
    expect(fullScreenHtml).toContain("SOLE · Authentic Footwear");

    const compactHtml = renderToStaticMarkup(
      <SolePageLoader compact label="Đang tải thông báo..." />
    );

    expect(compactHtml).toContain('data-variant="compact"');
    expect(compactHtml).toContain("py-6");
    expect(compactHtml).not.toContain("min-h-screen");
    expect(compactHtml).toContain("Đang tải thông báo...");
    expect(compactHtml).not.toContain("SOLE · Authentic Footwear");
  });

  it("respects prefers-reduced-motion without throwing", () => {
    installStorageAndWindowMock({ reducedMotion: true });
    const html = renderToStaticMarkup(
      <SolePageLoader label="Đang tải sản phẩm..." />
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Đang tải sản phẩm...");
  });
});

describe("RouteTransitionBar", () => {
  it("renders fixed top #E53935 shimmer bar with 380ms transition duration", () => {
    expect(ROUTE_TRANSITION_DURATION_MS).toBe(380);

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/products"]}>
        <RouteTransitionBar />
      </MemoryRouter>
    );

    expect(html).toContain('data-testid="route-transition-bar"');
    expect(html).toContain('data-pathname="/products"');
    expect(html).toContain(
      "pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#E53935]"
    );
  });

  it("renders when active prop is explicitly enabled even on auth/admin paths", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/admin"]}>
        <RouteTransitionBar active />
      </MemoryRouter>
    );

    expect(html).toContain('data-testid="route-transition-bar"');
    expect(html).toContain('data-pathname="/admin"');
  });
});

describe("ProtectedRoute loading state", () => {
  it("renders SolePageLoader fullScreen while verifying authentication instead of legacy English spinner", () => {
    installStorageAndWindowMock({ userLoggedIn: "true" });
    mockAuthState = {
      user: null,
      loading: true,
    };

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <div>Private Orders</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('data-variant="fullscreen"');
    expect(html).toContain("Đang xác thực phiên đăng nhập...");
    expect(html).not.toContain("Verifying authentication...");
    expect(html).not.toContain("Private Orders");
  });

  it("renders protected child when user is authenticated", () => {
    installStorageAndWindowMock({ userLoggedIn: "true" });
    mockAuthState = {
      user: {
        id: "u-1",
        email: "member@sole.vn",
        fullName: "SOLE Member",
        role: UserRole.CUSTOMER,
      } as User,
      loading: false,
    };

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route
            path="/orders"
            element={
              <ProtectedRoute role={UserRole.CUSTOMER}>
                <div>Private Orders</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain("Private Orders");
  });
});

describe("Storefront & Admin detail pages use SolePageLoader", () => {
  it("renders SolePageLoader with page-specific Vietnamese labels across detail pages", () => {
    const cases: Array<{ element: React.ReactElement; expectedLabel: string }> = [
      { element: <ProductDetailPage />, expectedLabel: "Đang tải sản phẩm..." },
      { element: <CategoryProductsPage />, expectedLabel: "Đang tải danh mục..." },
      { element: <OrderDetailPage />, expectedLabel: "Đang tải đơn hàng..." },
      { element: <MyReturnDetailPage />, expectedLabel: "Đang tải yêu cầu đổi trả..." },
      { element: <NotificationsPage />, expectedLabel: "Đang tải thông báo..." },
      { element: <DashboardAdmin />, expectedLabel: "Đang tải bảng điều khiển..." },
      { element: <OrderDetailAdminPage />, expectedLabel: "Đang tải chi tiết đơn hàng..." },
      { element: <ProductDetailAdminPage />, expectedLabel: "Đang tải chi tiết sản phẩm..." },
      { element: <ReturnDetailAdminPage />, expectedLabel: "Đang tải chi tiết đổi trả..." },
      { element: <RolePermissionsPage />, expectedLabel: "Đang tải ma trận phân quyền..." },
    ];

    for (const { element, expectedLabel } of cases) {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <SmoothScrollProvider>{element}</SmoothScrollProvider>
        </MemoryRouter>
      );

      expect(html).toContain('data-testid="sole-page-loader"');
      expect(html).toContain(expectedLabel);
    }
  });
});
