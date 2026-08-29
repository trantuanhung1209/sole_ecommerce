import { SoleLogo } from "@/components/brand/SoleLogo";
import { CartDropdown } from "@/components/cart/CartDropdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { publicNavigation } from "@/config/publicNavigation";
import { useAppSelector } from "@/hooks/useRedux";
import { Menu, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import NotificationBell from "@/components/notifications/NotificationBell";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoggedIn, loading } = useAppSelector((state) => state.auth);

  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Main bar */}
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center">
            <SoleLogo size="md" />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-x-1 overflow-x-auto px-2 lg:flex lg:gap-x-2">
            {publicNavigation.map((item) => {
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors lg:px-3 lg:text-[15px] ${
                    active
                      ? "font-semibold text-accent after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-0.5 after:rounded-full after:bg-accent lg:after:left-3 lg:after:right-3"
                      : "text-[#6B7280] hover:bg-accent/5 hover:text-accent"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <CartDropdown />
            <div className="hidden md:flex items-center space-x-3">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ) : isLoggedIn && user ? (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <UserProfile
                    key={user.updatedAt || user.id}
                    user={{
                      name: user.fullName,
                      email: user.email,
                      avatar: user.avatar || user.googleAuth?.picture || "",
                      role: user.role,
                      lastLogin: user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString()
                        : "N/A",
                      updatedAt: user.updatedAt,
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="outline" size="default">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="default">
                      <User className="h-4 w-4 mr-1" />
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            <Button
              variant="default"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="max-w-[1240px] mx-auto px-4 py-4">
            <nav className="space-y-1">
              {publicNavigation.map((item) => {
                const IconComponent = item.icon;
                const active = item.match(location.pathname);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent/10 font-semibold text-accent"
                        : "text-[#6B7280] hover:bg-accent/5 hover:text-accent"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {!loading && !isLoggedIn ? (
              <div className="mt-4 flex gap-2 border-t pt-4">
                <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Đăng ký</Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
