import {
  LogOut,
  User,
  ChevronDown,
  Shield,
  Briefcase,
  Package,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser } from "@/store/slices";
import { useAppDispatch } from "@/hooks/useRedux";
import { useNavigate, useLocation } from "react-router-dom";
import { UserRole } from "@/types/user.type";
import { roleAccess } from "@/config/roleAccess";
import { getRoleLabel } from "@/utils/displayLabels";

interface UserProfileProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    lastLogin?: string;
    updatedAt?: string;
  };
}

function UserProfile({ user }: UserProfileProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleAdminDashboard = () => {
    navigate("/admin");
  };

  const handleStaffDashboard = () => {
    navigate("/staff");
  };

  const isAdmin = roleAccess.canAccessAdminPortal(user?.role as UserRole | undefined);
  const isOnAdminPage = location.pathname.startsWith("/admin");

  const canAccessStaff = roleAccess.canAccessStaffPortal(user?.role as UserRole | undefined);
  const isOnStaffPage = location.pathname.startsWith("/staff");

  const roleLabel = (role?: string) => getRoleLabel(role || "");

  return (
    <DropdownMenu>
      {/* User Profile */}
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-3 cursor-pointer group p-2 rounded-lg hover:bg-accent/30 transition-all duration-300 border border-transparent hover:border-border/50">
          {/* Avatar with status indicator */}
          <div className="relative">
            <Avatar className="h-9 w-9 ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300 group-hover:scale-105 shadow-lg">
              <AvatarImage 
                src={user?.avatar ? `${user.avatar}?t=${user.updatedAt || Date.now()}` : user?.avatar} 
                alt={user?.name}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground font-bold text-sm border-2 border-background shadow-inner">
                {getInitials(user?.name || "AU")}
              </AvatarFallback>
            </Avatar>
            {/* Online status dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse shadow-sm"></div>
          </div>

          {/* User info - hidden on small screens */}
          <div className="hidden md:flex flex-col space-y-0.5 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {roleLabel(user?.role)}
            </p>
          </div>

          {/* Dropdown indicator */}
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200 hidden md:block" />
        </div>
      </DropdownMenuTrigger>

      {/* Dropdown Menu Content */}
      <DropdownMenuContent
        align="end"
        className="w-72 border-2 border-border shadow-2xl bg-background/95 backdrop-blur-md"
        sideOffset={8}
      >
        {/* Enhanced User Header */}
        <DropdownMenuLabel className="border-b border-border/30 p-0 mb-2">
          <div className="p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/40 shadow-lg">
                <AvatarImage 
                  src={user?.avatar ? `${user.avatar}?t=${user.updatedAt || Date.now()}` : user?.avatar} 
                  alt={user?.name}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground font-bold">
                  {getInitials(user?.name || "AU")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Role and Last Login - Separated row */}
            <div className="flex flex-col space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/70 min-w-[60px]">
                  Vai trò:
                </span>
                <span className="px-2.5 py-1 bg-primary/20 text-primary rounded-full font-semibold">
                  {roleLabel(user?.role)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/70 min-w-[60px]">
                  Lần cuối:
                </span>
                <span className="text-muted-foreground font-medium">
                  {user?.lastLogin || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Menu Items */}
        <div className="px-2 pb-2">
          {/* Admin Dashboard - Only show if user is admin and not on admin page */}
          {isAdmin && !isOnAdminPage && (
            <DropdownMenuItem
              onClick={handleAdminDashboard}
              className="cursor-pointer hover:bg-orange-500/10 p-3 rounded-lg transition-all duration-200 group"
            >
              <Shield className="mr-3 h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-medium text-orange-600">
                  Trang quản trị
                </span>
                <span className="text-xs text-muted-foreground">
                  Quản lý hệ thống
                </span>
              </div>
            </DropdownMenuItem>
          )}

          {/* Staff portal - only show when staff user is not already on staff pages */}
          {canAccessStaff && !isOnStaffPage && (
            <DropdownMenuItem
              onClick={handleStaffDashboard}
              className="cursor-pointer hover:bg-purple-500/10 p-3 rounded-lg transition-all duration-200 group"
            >
              <Briefcase className="mr-3 h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-medium text-purple-600">
                  Trang nhân viên
                </span>
                <span className="text-xs text-muted-foreground">
                  Quản lý công việc
                </span>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={handleProfile}
            className="cursor-pointer hover:bg-primary/10 p-3 rounded-lg transition-all duration-200 group"
          >
            <User className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-medium">Hồ sơ của tôi</span>
              <span className="text-xs text-muted-foreground">
                Xem và chỉnh sửa hồ sơ
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/wishlist")}
            className="cursor-pointer hover:bg-primary/10 p-3 rounded-lg transition-all duration-200 group"
          >
            <Package className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-medium">Wishlist</span>
              <span className="text-xs text-muted-foreground">Sản phẩm yêu thích</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/orders")}
            className="cursor-pointer hover:bg-primary/10 p-3 rounded-lg transition-all duration-200 group"
          >
            <Package className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-medium">Đơn hàng của tôi</span>
              <span className="text-xs text-muted-foreground">
                Xem lịch sử mua hàng
              </span>
            </div>
          </DropdownMenuItem>

          {/* Add separator before logout */}
          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 p-3 rounded-lg transition-all duration-200 group"
          >
            <LogOut className="mr-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            <div className="flex flex-col">
              <span className="font-medium">Đăng xuất</span>
              <span className="text-xs text-muted-foreground">
                Thoát khỏi tài khoản
              </span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserProfile;
