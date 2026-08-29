import { Bell } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/hooks/useRedux";

export default function NotificationBell() {
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const { counts, items, markRead, markAllRead } = useNotifications(Boolean(isLoggedIn));

  if (!isLoggedIn) return null;

  return (
    <DropdownMenu>
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
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          {counts.total > 0 && (
            <button type="button" className="text-xs text-primary" onClick={() => void markAllRead()}>
              Đánh dấu đã đọc
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Chưa có thông báo</div>
        ) : (
          items.slice(0, 8).map((item) => (
            <DropdownMenuItem
              key={item.notificationId}
              className="flex flex-col items-start gap-1 py-3"
              onClick={() => {
                if (!item.read) void markRead(item.notificationId);
                if (item.targetUrl) navigate(item.targetUrl);
              }}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={`text-sm font-medium ${item.read ? "text-muted-foreground" : ""}`}>
                  {item.title}
                </span>
                {!item.read && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2">{item.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
