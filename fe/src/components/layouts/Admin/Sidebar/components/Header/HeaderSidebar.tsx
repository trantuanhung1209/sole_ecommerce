import { Menu, X } from "lucide-react";
import { SoleLogo } from "@/components/brand/SoleLogo";

interface HeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
}

function HeaderSidebar({
  isCollapsed,
  isMobile,
  onToggleCollapse,
  onClose,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
      {(!isCollapsed || isMobile) && (
        <div className="flex items-center space-x-3">
          <SoleLogo variant="icon" size="sm" />
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">
              SOLE
            </h2>
            <p className="text-xs text-sidebar-foreground/60">
              Quản trị cửa hàng
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={isMobile ? onClose : onToggleCollapse}
        className={`p-2 rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200 group ${
          isCollapsed && !isMobile ? "mx-auto" : ""
        }`}
      >
        {isMobile ? (
          <X className="w-5 h-5 text-sidebar-foreground group-hover:text-primary transition-colors" />
        ) : (
          <Menu className="w-5 h-5  text-sidebar-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
    </div>
  );
}

export default HeaderSidebar;
