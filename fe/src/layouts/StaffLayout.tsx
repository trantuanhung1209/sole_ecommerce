import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import StaffSidebar from "@/components/layouts/Staff/Sidebar/Sidebar";
import HeaderStaff from "@/components/layouts/Staff/Header/HeaderStaff";

export default function StaffLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <StaffSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobile={isMobile}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-shrink-0">
          <HeaderStaff
            isMobile={isMobile}
            toggleMobileMenu={toggleMobileMenu}
          />
        </div>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background/98 to-accent/5 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
