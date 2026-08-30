import { SoleLogo } from "@/components/brand/SoleLogo";
import { CartDropdown } from "@/components/cart/CartDropdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { publicNavigation } from "@/config/publicNavigation";
import { useAppSelector } from "@/hooks/useRedux";
import { Menu, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import { HeaderSearch } from "./components/HeaderSearch";
import NotificationBell from "@/components/notifications/NotificationBell";
import type { User } from "@/types/user.type";
import { cn } from "@/lib/utils";

function AuthActions({
  loading,
  isLoggedIn,
  user,
  compact = false,
}: {
  loading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-full" />
        {!compact ? <Skeleton className="hidden h-4 w-16 rounded xl:block" /> : null}
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <UserProfile
          key={user.updatedAt || user.id}
          user={{
            name: user.fullName,
            email: user.email,
            avatar: user.avatar || user.googleAuth?.picture || "",
            role: user.role,
            lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "N/A",
            updatedAt: user.updatedAt,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-[#E5E7EB] bg-white px-3 hover:border-accent/30 hover:text-accent"
        >
          Đăng nhập
        </Button>
      </Link>
      <Link to="/register" className="hidden sm:block">
        <Button size="sm" className="h-9 bg-[#111111] px-3 hover:bg-accent">
          <UserIcon className="mr-1.5 h-4 w-4" />
          Đăng ký
        </Button>
      </Link>
    </div>
  );
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoggedIn, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB]/90 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-[1240px] px-4">
        <div className="flex h-[64px] items-center gap-2 sm:gap-3 lg:h-[72px] lg:gap-4">
          <Link to="/" className="flex shrink-0 items-center">
            <SoleLogo size="md" />
          </Link>

          <nav className="hidden min-w-0 items-center lg:flex lg:gap-0.5 xl:gap-1">
            {publicNavigation.map((item) => {
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "relative whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-medium transition-colors xl:px-3 xl:text-sm",
                    active
                      ? "font-semibold text-accent after:absolute after:bottom-0.5 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-accent xl:after:left-3 xl:after:right-3"
                      : "text-[#6B7280] hover:text-accent"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <HeaderSearch
            className="min-w-0 flex-1 lg:mx-1 lg:max-w-[280px] xl:max-w-[360px]"
            onNavigate={() => setIsMenuOpen(false)}
          />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <CartDropdown />
            <div className="hidden md:flex">
              <AuthActions loading={loading} isLoggedIn={Boolean(isLoggedIn)} user={user} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-[#F1F1EF] bg-white lg:hidden">
          <div className="mx-auto max-w-[1240px] space-y-4 px-4 py-4">
            <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {publicNavigation.map((item) => {
                const IconComponent = item.icon;
                const active = item.match(location.pathname);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent/10 font-semibold text-accent"
                        : "text-[#6B7280] hover:bg-[#F7F7F5] hover:text-accent"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {!loading && !isLoggedIn ? (
              <div className="flex gap-2 border-t border-[#F1F1EF] pt-4">
                <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-[#111111] hover:bg-accent">Đăng ký</Button>
                </Link>
              </div>
            ) : null}

            {!loading && isLoggedIn && user ? (
              <div className="flex items-center justify-end gap-2 border-t border-[#F1F1EF] pt-4 md:hidden">
                <AuthActions loading={loading} isLoggedIn compact user={user} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
