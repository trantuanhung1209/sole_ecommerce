import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useRedux";
import { useNotifications } from "@/hooks/useNotifications";

import type { SubMenuItem } from "./types/type";
import { menuItems as baseMenuItems } from "./data/MenuData";
import { filterAdminMenu } from "@/config/menuAccess";
import HeaderSidebar from "./components/Header/HeaderSidebar";
import MenuSidebar from "./components/Menu/MenuSidebar";
import { BackToHomeAdmin } from "../BackToHomeAdmin";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  isOpen = false,
  onClose,
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const { counts } = useNotifications(!!user);

  // Cập nhật menuItems với badge counts
  const menuItems = filterAdminMenu(
    baseMenuItems.map((item) => {
      if (item.href === "/admin/returns") {
        return {
          ...item,
          badge: counts.pendingReturns > 0 ? counts.pendingReturns : undefined,
        };
      }
      if (item.href === "/admin/orders") {
        return {
          ...item,
          badge: counts.pendingOrders > 0 ? counts.pendingOrders : undefined,
        };
      }
      return item;
    }),
    user?.role
  );

  const toggleExpanded = (title: string) => {
    // Tìm menu item để check có submenu không
    const menuItem = menuItems.find((item) => item.title === title);
    const hasSubItems = menuItem?.subItems && menuItem.subItems.length > 0;

    // Nếu sidebar đang collapse và menu có submenu, thì mở rộng sidebar
    if (isCollapsed && !isMobile && hasSubItems) {
      onToggleCollapse(); // Mở rộng sidebar trước

      // Delay một chút để sidebar mở rộng xong rồi mới expand menu
      setTimeout(() => {
        setExpandedItems((prev) =>
          prev.includes(title)
            ? prev.filter((item) => item !== title)
            : [...prev, title]
        );
      }, 100);
      return;
    }

    // Logic bình thường khi sidebar đã mở rộng
    if (isCollapsed && !isMobile) return;

    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = React.useCallback(
    (href?: string) => {
      if (!href) return false;

      // Exact match cho tất cả menu items để tránh conflict
      return location.pathname === href;
    },
    [location.pathname]
  );

  const isParentActive = React.useCallback(
    (subItems?: SubMenuItem[]) => {
      if (!subItems) return false;
      return subItems.some((item) => isActive(item.href));
    },
    [isActive]
  );

  // Auto expand parent menu when sub-item is active
  React.useEffect(() => {
    const activeParent = menuItems.find((item) => {
      if (item.subItems && isParentActive(item.subItems)) {
        return true;
      }
      return false;
    });

    if (activeParent && !expandedItems.includes(activeParent.title)) {
      setExpandedItems((prev) => [...prev, activeParent.title]);
    }
  }, [location.pathname, expandedItems, isParentActive]);

  const sidebarClasses = `
    ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"}
    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
    ${isCollapsed && !isMobile ? "w-21" : "w-72"}
    bg-gradient-to-b from-sidebar via-sidebar/95 to-sidebar/90
    border-r border-sidebar-border/60
    flex flex-col
    h-screen
    min-h-screen
    max-h-screen
    overflow-hidden
    transition-all duration-300 ease-in-out
    backdrop-blur-sm
    shadow-xl shadow-sidebar-border/20
  `;

  const overlayClasses = `
    ${isMobile && isOpen ? "block" : "hidden"}
    fixed inset-0 bg-black/50 z-40 backdrop-blur-sm
  `;

  return (
    <>
      {/* Mobile Overlay */}
      <div className={overlayClasses} onClick={onClose} />

      {/* Sidebar */}
      <div className={sidebarClasses}>
        {/* Header */}
        <HeaderSidebar
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onToggleCollapse={onToggleCollapse}
          onClose={onClose}
        />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <MenuSidebar
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            menuItems={menuItems}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
            isActive={isActive}
            isParentActive={isParentActive}
          />
        </div>

        {/* Back to Home Button */}
        <div className="border-t border-sidebar-border mt-auto">
          <BackToHomeAdmin isCollapsed={isCollapsed} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
