import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderTitle from "./components/HeaderTitle";
import HeaderActions from "./components/HeaderActions";

interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface HeaderStaffProps {
  isMobile: boolean;
  toggleMobileMenu: () => void;
  breadcrumbItems?: BreadcrumbItemData[];
}

function HeaderStaff({
  isMobile,
  toggleMobileMenu,
  breadcrumbItems = [{ label: "Tổng quan", isCurrentPage: true }],
}: HeaderStaffProps) {
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

          <HeaderTitle breadcrumbItems={breadcrumbItems} />
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}

export default HeaderStaff;
