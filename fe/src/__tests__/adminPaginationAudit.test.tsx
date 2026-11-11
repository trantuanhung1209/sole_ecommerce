import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { roleAccess } from "@/config/roleAccess";
import { UserRole, type UserRole as UserRoleType } from "@/types/user.type";
import type { Brand, Category } from "@/types/ecommerce.type";
import type { Coupon } from "@/services/ecommerceServices";

let mockUserRole: UserRoleType | undefined = UserRole.ADMIN;

vi.mock("@/services/ecommerceServices", () => ({
  brandApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  },
  categoryApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  },
  promotionApi: {
    listCoupons: vi.fn().mockResolvedValue([]),
    createCoupon: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/hooks/useRedux", () => ({
  useAppSelector: (selector: (state: { auth: { user: { role: UserRoleType } | null } }) => unknown) =>
    selector({
      auth: {
        user: mockUserRole ? { role: mockUserRole } : null,
      },
    }),
  useAppDispatch: () => vi.fn(),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    counts: { pendingReturns: 2, pendingOrders: 3 },
  }),
}));

vi.mock("@/hooks/useRoleAccess", () => ({
  useRoleAccess: () => ({
    role: mockUserRole,
    permissions: undefined,
    ...roleAccess,
    access: {
      adminPortal: roleAccess.canAccessAdminPortal(mockUserRole),
      staffPortal: roleAccess.canAccessStaffPortal(mockUserRole),
      manageUsers: roleAccess.canManageUsers(mockUserRole),
      manageRbac: roleAccess.canManageRbac(mockUserRole),
      createProduct: roleAccess.canCreateProduct(mockUserRole),
      editProduct: roleAccess.canEditProduct(mockUserRole),
      approveProduct: roleAccess.canApproveProduct(mockUserRole),
      publishProduct: roleAccess.canPublishProduct(mockUserRole),
      deleteProduct: roleAccess.canDeleteProduct(mockUserRole),
      brandsCategories: roleAccess.canManageBrandsCategories(mockUserRole),
      viewInventory: roleAccess.canViewInventory(mockUserRole),
      adjustInventory: roleAccess.canAdjustInventory(mockUserRole),
      manageOrders: roleAccess.canManageOrders(mockUserRole),
      moderateReviews: roleAccess.canModerateReviews(mockUserRole),
      processReturnStaff: roleAccess.canProcessReturnStaff(mockUserRole),
      approveReturn: roleAccess.canApproveReturn(mockUserRole),
      viewReports: roleAccess.canViewReports(mockUserRole),
    },
  }),
}));

import {
  ADMIN_PAGE_SIZE,
  ADMIN_PAGE_SIZE_OPTIONS,
  clampPage,
  paginateSlice,
  scrollPortalToTop,
} from "@/pages/admin/utils/pagination";
import BrandManagementPage from "@/pages/admin/BrandManagement/BrandManagementPage";
import CategoryManagementPage from "@/pages/admin/CategoryManagement/CategoryManagementPage";
import PromotionManagementPage from "@/pages/admin/PromotionManagement/PromotionManagementPage";
import AdminSidebar from "@/components/layouts/Admin/Sidebar/Sidebar";
import StaffSidebar from "@/components/layouts/Staff/Sidebar/Sidebar";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";

function makeBrands(count: number): Brand[] {
  return Array.from({ length: count }, (_, idx) => ({
    brandId: `brand-${idx + 1}`,
    name: `Brand ${String(idx + 1).padStart(2, "0")}`,
    slug: `brand-${idx + 1}`,
  }));
}

function makeCategories(count: number): Category[] {
  return Array.from({ length: count }, (_, idx) => ({
    categoryId: `cat-${idx + 1}`,
    name: `Category ${String(idx + 1).padStart(2, "0")}`,
    slug: `category-${idx + 1}`,
  }));
}

function makeCoupons(count: number): Coupon[] {
  return Array.from({ length: count }, (_, idx) => ({
    couponId: `coupon-${idx + 1}`,
    code: `SOLE${String(idx + 1).padStart(2, "0")}`,
    type: idx % 2 === 0 ? "PERCENTAGE" : "FIXED_AMOUNT",
    value: (idx + 1) * 5,
    active: idx % 3 !== 0,
    usedCount: idx,
    usageLimit: 100,
  }));
}

describe("admin pagination helpers", () => {
  it("uses standardized page size 8 and selector options [8, 16, 24]", () => {
    expect(ADMIN_PAGE_SIZE).toBe(8);
    expect(ADMIN_PAGE_SIZE_OPTIONS).toEqual([8, 16, 24]);
  });

  it("clamps page numbers safely when list is empty or shrinks after delete", () => {
    expect(clampPage(0, 0)).toBe(0);
    expect(clampPage(3, 0)).toBe(0);
    expect(clampPage(-2, 4)).toBe(0);
    expect(clampPage(5, 2)).toBe(1);
    expect(clampPage(1, 3)).toBe(1);
  });

  it("slices arrays and clamps out-of-range page automatically", () => {
    const items = Array.from({ length: 12 }, (_, idx) => idx + 1);
    const first = paginateSlice(items, 0, ADMIN_PAGE_SIZE);
    expect(first).toEqual({
      content: [1, 2, 3, 4, 5, 6, 7, 8],
      page: 0,
      totalPages: 2,
      totalElements: 12,
    });

    const second = paginateSlice(items, 1, ADMIN_PAGE_SIZE);
    expect(second).toEqual({
      content: [9, 10, 11, 12],
      page: 1,
      totalPages: 2,
      totalElements: 12,
    });

    const afterDelete = paginateSlice(items.slice(0, 8), 1, ADMIN_PAGE_SIZE);
    expect(afterDelete).toEqual({
      content: [1, 2, 3, 4, 5, 6, 7, 8],
      page: 0,
      totalPages: 1,
      totalElements: 8,
    });
  });

  it("scrolls both smooth-scroll provider and portal main container", () => {
    const scrollToTop = vi.fn();
    const mainScrollTo = vi.fn();
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        querySelector: vi.fn().mockReturnValue({ scrollTo: mainScrollTo }),
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      },
    });

    scrollPortalToTop(scrollToTop);
    expect(scrollToTop).toHaveBeenCalledTimes(1);
    expect(mainScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  });
});

describe("Brand, Category, and Promotion management pagination & role guards", () => {
  beforeEach(() => {
    mockUserRole = UserRole.ADMIN;
  });

  it("renders BrandManagementPage with 8 items per page and TablePagination", () => {
    const brands = makeBrands(12);
    const page1Html = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <BrandManagementPage initialBrands={brands} initialPage={0} />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(page1Html).toContain("Brand 01");
    expect(page1Html).toContain("Brand 08");
    expect(page1Html).not.toContain("Brand 09");
    expect(page1Html).toContain("Tổng 12 mục");
    expect(page1Html).toContain("Trang 1 / 2");

    const page2Html = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <BrandManagementPage initialBrands={brands} initialPage={1} />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(page2Html).not.toContain("Brand 01");
    expect(page2Html).toContain("Brand 09");
    expect(page2Html).toContain("Brand 12");
    expect(page2Html).toContain("Trang 2 / 2");
  });

  it("renders CategoryManagementPage with 8 items per page and hides create form for SHOP_MANAGER", () => {
    mockUserRole = UserRole.SHOP_MANAGER;
    const categories = makeCategories(11);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <CategoryManagementPage initialCategories={categories} initialPage={1} />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(html).not.toContain("Category 01");
    expect(html).toContain("Category 09");
    expect(html).toContain("Category 11");
    expect(html).toContain("Tổng 11 mục");
    expect(html).toContain("Trang 2 / 2");
    expect(html).not.toContain("Tên danh mục");
  });

  it("renders PromotionManagementPage with search, status filter, 8-per-page pagination, and role guard", () => {
    const coupons = makeCoupons(10);

    mockUserRole = UserRole.SHOP_MANAGER;
    const managerHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <PromotionManagementPage initialCoupons={coupons} initialPage={0} />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(managerHtml).toContain("SOLE01");
    expect(managerHtml).toContain("SOLE08");
    expect(managerHtml).not.toContain("SOLE09");
    expect(managerHtml).toContain('id="promotion-status"');
    expect(managerHtml).toContain("Tạo coupon");
    expect(managerHtml).toContain("Tổng 10 mục");
    expect(managerHtml).toContain("Trang 1 / 2");

    mockUserRole = UserRole.STAFF;
    const staffHtml = renderToStaticMarkup(
      <MemoryRouter>
        <SmoothScrollProvider>
          <PromotionManagementPage initialCoupons={coupons} initialPage={1} />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(staffHtml).toContain("SOLE09");
    expect(staffHtml).toContain("SOLE10");
    expect(staffHtml).not.toContain("Tạo coupon");
  });
});

describe("Role & Navigation audit across STAFF, SHOP_MANAGER, ADMIN, SUPER_ADMIN", () => {
  it("matches backend @PreAuthorize permissions across all four operational roles", () => {
    // STAFF
    expect(roleAccess.canAccessStaffPortal(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canAccessAdminPortal(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canCreateProduct(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canEditProduct(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canManageVariants(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canApproveProduct(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canPublishProduct(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canDeleteProduct(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canManageBrandsCategories(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canManagePromotions(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canViewInventory(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canAdjustInventory(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canManageOrders(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canCancelOrder(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canModerateReviews(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canProcessReturnStaff(UserRole.STAFF)).toBe(true);
    expect(roleAccess.canApproveReturn(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canViewReports(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canManageUsers(UserRole.STAFF)).toBe(false);
    expect(roleAccess.canManageRbac(UserRole.STAFF)).toBe(false);

    // SHOP_MANAGER
    expect(roleAccess.canAccessStaffPortal(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canAccessAdminPortal(UserRole.SHOP_MANAGER)).toBe(false);
    expect(roleAccess.canCreateProduct(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canEditProduct(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canManageVariants(UserRole.SHOP_MANAGER)).toBe(false);
    expect(roleAccess.canApproveProduct(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canPublishProduct(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canDeleteProduct(UserRole.SHOP_MANAGER)).toBe(false);
    expect(roleAccess.canManageBrandsCategories(UserRole.SHOP_MANAGER)).toBe(false);
    expect(roleAccess.canManagePromotions(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canAdjustInventory(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canCancelOrder(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canApproveReturn(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canViewReports(UserRole.SHOP_MANAGER)).toBe(true);
    expect(roleAccess.canManageUsers(UserRole.SHOP_MANAGER)).toBe(false);
    expect(roleAccess.canManageRbac(UserRole.SHOP_MANAGER)).toBe(false);

    // ADMIN
    expect(roleAccess.canAccessAdminPortal(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canManageVariants(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canDeleteProduct(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canManageBrandsCategories(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canManagePromotions(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canManageUsers(UserRole.ADMIN)).toBe(true);
    expect(roleAccess.canManageRbac(UserRole.ADMIN)).toBe(false);

    // SUPER_ADMIN
    expect(roleAccess.canAccessAdminPortal(UserRole.SUPER_ADMIN)).toBe(true);
    expect(roleAccess.canManageRbac(UserRole.SUPER_ADMIN)).toBe(true);
    expect(roleAccess.canManagePromotions(UserRole.SUPER_ADMIN)).toBe(true);
  });

  it("renders AdminSidebar links including Promotions and gates RBAC to SUPER_ADMIN", () => {
    mockUserRole = UserRole.ADMIN;
    const adminHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <AdminSidebar isCollapsed={false} onToggleCollapse={vi.fn()} />
      </MemoryRouter>
    );
    expect(adminHtml).toContain('href="/admin/promotions"');
    expect(adminHtml).toContain('href="/admin/users"');
    expect(adminHtml).not.toContain('href="/admin/role-permissions"');

    mockUserRole = UserRole.SUPER_ADMIN;
    const superAdminHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/admin/role-permissions"]}>
        <AdminSidebar isCollapsed={false} onToggleCollapse={vi.fn()} />
      </MemoryRouter>
    );
    expect(superAdminHtml).toContain('href="/admin/promotions"');
    expect(superAdminHtml).toContain('href="/admin/role-permissions"');
  });

  it("renders StaffSidebar operational links for STAFF and SHOP_MANAGER", () => {
    mockUserRole = UserRole.STAFF;
    const staffHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/staff/products/prod-1"]}>
        <StaffSidebar isCollapsed={false} onToggleCollapse={vi.fn()} />
      </MemoryRouter>
    );
    expect(staffHtml).toContain('href="/staff"');
    expect(staffHtml).toContain('href="/staff/products"');
    expect(staffHtml).toContain('href="/staff/inventory"');
    expect(staffHtml).toContain('href="/staff/orders"');
    expect(staffHtml).toContain('href="/staff/returns"');
    expect(staffHtml).toContain('href="/staff/reviews"');
  });
});
