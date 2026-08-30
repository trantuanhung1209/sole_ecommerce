import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TablePagination } from "@/components/shared/TablePagination";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/hooks/useRedux";

export default function NotificationBell() {
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const {
    counts,
    items,
    page,
    totalPages,
    totalElements,
    loading,
    goToPage,
    markRead,
    markAllRead,
    refetch,
  } = useNotifications(Boolean(isLoggedIn));

  if (!isLoggedIn) return null;

  return (
    <DropdownMenu onOpenChange={(open) => open && refetch()}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative border-none shadow-none">
          <Bell className="h-5 w-5" />
          {counts.total > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
              {counts.total > 99 ? "99+" : counts.total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-3 py-2">
          <DropdownMenuLabel className="flex items-center justify-between px-0">
            <span>Thông báo</span>
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => navigate("/notifications")}
            >
              Xem tất cả
            </button>
          </DropdownMenuLabel>
          {totalElements > 0 && (
            <p className="text-xs text-muted-foreground">{totalElements} thông báo</p>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {counts.total > 0 && (
          <div className="px-3 py-2">
            <button type="button" className="text-xs text-primary" onClick={() => void markAllRead()}>
              Đánh dấu đã đọc
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Chưa có thông báo</div>
        ) : (
          <>
            {items.map((item) => (
              <DropdownMenuItem
                key={item.notificationId}
                className="flex flex-col items-start gap-1 rounded-none py-3"
                onClick={() => {
                  if (!item.read) void markRead(item.notificationId);
                  if (item.targetUrl) navigate(item.targetUrl);
                }}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${item.read ? "text-muted-foreground" : ""}`}>
                    {item.title}
                  </span>
                  {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">{item.message}</span>
              </DropdownMenuItem>
            ))}
            <div className="border-t px-3 py-2">
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={goToPage}
                className="pt-0 sm:flex-col sm:items-stretch sm:gap-2"
              />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
