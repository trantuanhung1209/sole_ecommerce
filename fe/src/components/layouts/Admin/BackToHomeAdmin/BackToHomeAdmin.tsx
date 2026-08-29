import { Link } from "react-router-dom";
import { Home } from "lucide-react";

interface BackToHomeAdminProps {
  isCollapsed?: boolean;
  className?: string;
}

export const BackToHomeAdmin = ({
  isCollapsed = false,
  className = "",
}: BackToHomeAdminProps) => {
  return (
    <div className={`px-4 py-3 ${className}`}>
      <Link
        to="/"
        className="group relative flex items-center justify-center w-full"
      >
        {/* Background container with gradient */}
        <div className="relative w-full">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/30 via-sidebar-accent/20 to-sidebar-primary/30 rounded-xl blur-lg opacity-0 group-hover:opacity-70 transition-all duration-500" />

          {/* Main button */}
          <div className="relative bg-gradient-to-br from-sidebar-accent/80 via-sidebar-accent/60 to-sidebar-accent/40 hover:from-sidebar-primary/20 hover:via-sidebar-primary/15 hover:to-sidebar-primary/10 backdrop-blur-sm border border-sidebar-border hover:border-sidebar-primary/40 rounded-xl transition-all duration-400 group-hover:scale-[1.02] shadow-lg hover:shadow-xl">
            {/* Inner glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/10 via-transparent to-sidebar-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

            {/* Content */}
            <div
              className={`relative flex items-center gap-3 p-3 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              {/* Icon container */}
              <div className="relative">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary/90 via-sidebar-primary/80 to-sidebar-primary/70 group-hover:from-sidebar-primary group-hover:via-sidebar-primary/95 group-hover:to-sidebar-primary/85 transition-all duration-400 shadow-md border border-sidebar-primary/30">
                  {/* Inner shine */}
                  <div className="absolute inset-0.5 bg-gradient-to-br from-sidebar-primary-foreground/20 to-transparent rounded-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                  <Home className="relative h-4 w-4 text-sidebar-primary-foreground transition-all duration-300 group-hover:scale-110" />
                </div>
              </div>

              {/* Text content - only show when not collapsed */}
              {!isCollapsed && (
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold text-sidebar-foreground group-hover:text-sidebar-primary transition-colors duration-300 truncate">
                    Về trang chủ
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-sidebar-foreground/80 transition-colors duration-300 truncate">
                    Quay lại website
                  </span>
                </div>
              )}

              {/* Decorative dots - only show when not collapsed */}
              {!isCollapsed && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary/60 group-hover:bg-sidebar-primary transition-all duration-300 group-hover:scale-125" />
                  <div className="w-2 h-2 rounded-full bg-sidebar-ring/50 group-hover:bg-sidebar-ring transition-all duration-400 delay-75 group-hover:scale-125" />
                </div>
              )}
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-sidebar-primary/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-400" />
          </div>

          {/* Floating particles for collapsed state */}
          {isCollapsed && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1 right-1 w-0.5 h-0.5 bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-ping" />
              <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-accent/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-300 group-hover:animate-ping" />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
