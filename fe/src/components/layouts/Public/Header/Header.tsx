import { SoleLogo } from "@/components/brand/SoleLogo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/hooks/useRedux";
import { Home, Menu, MessageCircle, ShoppingBag, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import NotificationBell from "@/components/notifications/NotificationBell";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoggedIn, loading } = useAppSelector((state) => state.auth);

  const location = useLocation();

  const navigation = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Sản phẩm", href: "/products", icon: ShoppingBag },
    {
      name: "Giỏ hàng",
      href: isLoggedIn ? "/cart" : `/login?redirect=${encodeURIComponent("/cart")}`,
      icon: ShoppingCart,
      guestHint: !isLoggedIn,
    },
    { name: "Trợ lý AI", href: "/ai-chat", icon: MessageCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Main bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <SoleLogo size="md" />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 text-md font-medium transition-colors hover:text-primary ${
                    isActive(item.href) ? "text-primary" : "text-gray-800 "
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                  {"guestHint" in item && item.guestHint && (
                    <span className="text-[10px] text-muted-foreground">(đăng nhập)</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth & Actions - Desktop */}
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
                  // Priority: avatar > googleAuth.picture > empty
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

          {/* Mobile menu toggle */}
          <Button
            variant="default"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="max-w-[1200px] mx-auto px-4 py-4">
            <nav className="space-y-3">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive(item.href)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
