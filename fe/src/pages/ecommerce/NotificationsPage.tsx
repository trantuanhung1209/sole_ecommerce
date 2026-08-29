import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { notificationApi } from "@/services/notificationServices";
import type { AppNotification } from "@/types/notification.type";
import { TablePagination } from "@/components/shared/TablePagination";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationApi.list(page, PAGE_SIZE);
      setItems(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    await notificationApi.markRead(id);
    load();
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    load();
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thông báo</h1>
          <p className="text-sm text-muted-foreground">{totalElements} thông báo</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Không có thông báo.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.notificationId}
              className={`rounded-lg border p-4 ${n.read ? "opacity-70" : "bg-primary/5 border-primary/20"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  {n.createdAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.notificationId)}>
                      Đã đọc
                    </Button>
                  )}
                  {n.targetUrl && (
                    <Button size="sm" variant="link" asChild>
                      <Link to={n.targetUrl}>Xem</Link>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
      />
    </div>
  );
}
