import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SubMenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
  badge?: number;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: SubMenuItem[];
  badge?: number;
}

function MenuSidebar({
  isCollapsed,
  isMobile,
  menuItems,
  expandedItems,
  toggleExpanded,
  isActive,
  isParentActive,
}: {
  isCollapsed: boolean;
  isMobile: boolean;
  menuItems: MenuItem[];
  expandedItems: string[];
  toggleExpanded: (title: string) => void;
  isActive: (href?: string) => boolean;
  isParentActive: (subItems?: SubMenuItem[]) => boolean;
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border/90 scrollbar-track-transparent">
      {menuItems.map((item) => {
        const isExpanded = expandedItems.includes(item.title);
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const itemIsActive =
          isActive(item.href) || isParentActive(item.subItems);

        return (
          <div key={item.title} className="space-y-1">
            {/* Main Menu Item */}
            <div
              className={`
                    group relative rounded-xl transition-all duration-300 ease-out
                    ${
                      itemIsActive
                        ? "bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 shadow-lg shadow-primary/10"
                        : "hover:bg-sidebar-accent/30"
                    }
                  `}
            >
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className="w-full flex items-center justify-between p-3 text-left transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                          p-2 rounded-lg transition-all duration-300
                          ${
                            itemIsActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-sidebar-accent/40 text-sidebar-foreground group-hover:bg-primary/80 group-hover:text-primary-foreground"
                          }
                        `}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>

                    {(!isCollapsed || isMobile) && (
                      <div className="flex-1">
                        <span
                          className={`
                              font-medium transition-colors duration-200
                              ${
                                itemIsActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground group-hover:text-primary"
                              }
                            `}
                        >
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {(!isCollapsed || isMobile) && hasSubItems && (
                    <div
                      className={`
                          transition-transform duration-300 ease-out
                          ${isExpanded ? "rotate-90" : "rotate-0"}
                        `}
                    >
                      <ChevronRight
                        className={`
                            w-4 h-4 transition-colors duration-200
                            ${
                              itemIsActive
                                ? "text-primary"
                                : "text-sidebar-foreground/60 group-hover:text-primary"
                            }
                          `}
                      />
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  to={item.href || "#"}
                  className="flex items-center space-x-3 p-3 transition-all duration-200"
                >
                  <div
                    className={`
                        p-2 rounded-lg transition-all duration-300
                        ${
                          itemIsActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-sidebar-accent/40 text-sidebar-foreground group-hover:bg-primary/80 group-hover:text-primary-foreground"
                        }
                      `}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>

                  {(!isCollapsed || isMobile) && (
                    <span
                      className={`
                          font-medium transition-colors duration-200
                          ${
                            itemIsActive
                              ? "text-primary"
                              : "text-sidebar-foreground group-hover:text-primary"
                          }
                        `}
                    >
                      {item.title}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Sub Menu Items */}
            {hasSubItems && isExpanded && (!isCollapsed || isMobile) && (
              <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                {item.subItems?.map((subItem) => {
                  const subIsActive = isActive(subItem.href);

                  return (
                    <Link
                      key={subItem.href}
                      to={subItem.href}
                      className={`
                            group flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                            ${
                              subIsActive
                                ? "bg-gradient-to-r from-primary/15 to-primary/5 border-l-4 border-primary shadow-md shadow-primary/5"
                                : "hover:bg-sidebar-accent/20 border-l-4 border-transparent hover:border-primary/30"
                            }
                          `}
                    >
                      <div
                        className={`
                            p-1.5 rounded-md transition-all duration-300
                            ${
                              subIsActive
                                ? "bg-primary/20 text-primary"
                                : "bg-sidebar-accent/30 text-sidebar-foreground/80 group-hover:bg-primary/10 group-hover:text-primary"
                            }
                          `}
                      >
                        <subItem.icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1">
                        <div
                          className={`
                              text-sm font-medium transition-colors duration-200
                              ${
                                subIsActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground group-hover:text-primary"
                              }
                            `}
                        >
                          {subItem.title}
                        </div>
                        {subItem.description && (
                          <div className="text-xs text-sidebar-foreground/50 mt-0.5">
                            {subItem.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default MenuSidebar;
