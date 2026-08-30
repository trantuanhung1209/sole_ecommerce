import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { notificationApi } from "@/services/notificationServices";
import { subscribeNotificationStream } from "@/utils/notificationStream";
import { isNetworkError } from "@/utils/networkError";
import type { AppNotification, NotificationCounts } from "@/types/notification.type";

const defaultCounts: NotificationCounts = {
  total: 0,
  pendingOrders: 0,
  pendingReturns: 0,
};

export function useNotifications(enabled: boolean) {
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const applyCounts = useCallback((next: NotificationCounts) => {
    setCounts({
      total: next.total,
      pendingOrders: next.pendingOrders,
      pendingReturns: next.pendingReturns,
    });
  }, []);

  const fetchInitial = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [countData, recent] = await Promise.all([
        notificationApi.unreadCount(),
        notificationApi.recent(),
      ]);
      applyCounts(countData);
      setItems(recent);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  }, [applyCounts, enabled]);

  const refetch = useCallback(() => {
    void fetchInitial();
  }, [fetchInitial]);

  const markRead = useCallback(async (notificationId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.notificationId === notificationId ? { ...item, read: true } : item))
    );
    setCounts((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));

    try {
      await notificationApi.markRead(notificationId);
      const countData = await notificationApi.unreadCount();
      applyCounts(countData);
    } catch (error) {
      void fetchInitial();
      if (isNetworkError(error)) {
        toast.warn("Không kết nối được máy chủ. Thử lại sau vài giây.");
      }
    }
  }, [applyCounts, fetchInitial]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    applyCounts({ total: 0, pendingOrders: 0, pendingReturns: 0 });

    try {
      await notificationApi.markAllRead();
    } catch (error) {
      void fetchInitial();
      if (isNetworkError(error)) {
        toast.warn("Không kết nối được máy chủ. Thử lại sau vài giây.");
      }
    }
  }, [applyCounts, fetchInitial]);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    return subscribeNotificationStream(
      (event, data) => {
        if (event === "ping") return;
        if (event === "unread_count") {
          applyCounts(JSON.parse(data) as NotificationCounts);
          return;
        }
        if (event === "notification") {
          const notification = JSON.parse(data) as AppNotification;
          setItems((prev) =>
            [notification, ...prev.filter((n) => n.notificationId !== notification.notificationId)].slice(0, 20)
          );
          toast.info(notification.title, { autoClose: 4000 });
        }
      },
      setConnected
    );
  }, [applyCounts, enabled]);

  return {
    counts,
    items,
    loading,
    connected,
    refetch,
    markRead,
    markAllRead,
    totalNotifications: counts.total,
  };
}
