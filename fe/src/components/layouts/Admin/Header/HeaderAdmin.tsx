import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeaderTitle from "./components/HeaderTitle";
import HeaderActions from "./components/HeaderActions";
import type { BreadcrumbItemData } from "./components/HeaderBreadcrumb";

interface HeaderAdminProps {
  isMobile: boolean;
  toggleMobileMenu: () => void;
  breadcrumbItems?: BreadcrumbItemData[];
}

const ADMIN_ROUTE_LABELS: Record<string, string> = {
  products: "Sản phẩm",
  brands: "Thương hiệu",
  categories: "Danh mục",
  inventory: "Tồn kho",
  orders: "Đơn hàng",
  returns: "Đổi trả",
  reviews: "Đánh giá",
  promotions: "Khuyến mãi",
  users: "Người dùng",
  "role-permissions": "Vai trò & quyền hạn",
};

function buildAdminBreadcrumbs(pathname: string): BreadcrumbItemData[] {
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard", isCurrentPage: true }];
  }
  const section = segments[0];
  const label = ADMIN_ROUTE_LABELS[section] ?? section;
  if (segments.length === 1) {
    return [{ label, isCurrentPage: true }];
  }
  return [
    { label, href: `/admin/${section}` },
    { label: "Chi tiết", isCurrentPage: true },
  ];
}

function HeaderAdmin({
  isMobile,
  toggleMobileMenu,
  breadcrumbItems,
}: HeaderAdminProps) {
  const { pathname } = useLocation();
  const resolvedBreadcrumbs = breadcrumbItems ?? buildAdminBreadcrumbs(pathname);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b-2 border-border/60 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left Section: Mobile Menu + Title */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMobileMenu}
              className="md:hidden border-2 hover:border-primary/50 transition-all duration-300"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Page Header Info */}
          <HeaderTitle breadcrumbItems={resolvedBreadcrumbs} />
        </div>

        {/* Right Section: Actions */}
        <HeaderActions />
      </div>
    </header>
  );
}

export default HeaderAdmin;
