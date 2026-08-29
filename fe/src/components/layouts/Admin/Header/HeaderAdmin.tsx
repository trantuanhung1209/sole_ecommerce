import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderTitle from "./components/HeaderTitle";
import HeaderActions from "./components/HeaderActions";

interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface HeaderAdminProps {
  isMobile: boolean;
  toggleMobileMenu: () => void;
  breadcrumbItems?: BreadcrumbItemData[];
}

function HeaderAdmin({
  isMobile,
  toggleMobileMenu,
  breadcrumbItems = [{ label: "Dashboard", isCurrentPage: true }],
}: HeaderAdminProps) {
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
          <HeaderTitle breadcrumbItems={breadcrumbItems} />
        </div>

        {/* Right Section: Actions */}
        <HeaderActions />
      </div>
    </header>
  );
}

export default HeaderAdmin;
