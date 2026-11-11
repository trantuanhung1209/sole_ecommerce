import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeaderTitle from "./components/HeaderTitle";
import HeaderActions from "./components/HeaderActions";
import type { BreadcrumbItemData } from "./components/HeaderBreadcrumb";

interface HeaderStaffProps {
  isMobile: boolean;
  toggleMobileMenu: () => void;
  breadcrumbItems?: BreadcrumbItemData[];
}

const STAFF_ROUTE_LABELS: Record<string, string> = {
  products: "Sản phẩm",
  inventory: "Tồn kho",
  orders: "Đơn hàng",
  returns: "Đổi trả",
  reviews: "Đánh giá",
};

function buildStaffBreadcrumbs(pathname: string): BreadcrumbItemData[] {
  const segments = pathname.replace(/^\/staff\/?/, "").split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Tổng quan", isCurrentPage: true }];
  }
  const section = segments[0];
  const label = STAFF_ROUTE_LABELS[section] ?? section;
  if (segments.length === 1) {
    return [{ label, isCurrentPage: true }];
  }
  return [
    { label, href: `/staff/${section}` },
    { label: "Chi tiết", isCurrentPage: true },
  ];
}

function HeaderStaff({
  isMobile,
  toggleMobileMenu,
  breadcrumbItems,
}: HeaderStaffProps) {
  const { pathname } = useLocation();
  const resolvedBreadcrumbs = breadcrumbItems ?? buildStaffBreadcrumbs(pathname);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b-2 border-border/60 px-6 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
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

          <HeaderTitle breadcrumbItems={resolvedBreadcrumbs} />
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}

export default HeaderStaff;
