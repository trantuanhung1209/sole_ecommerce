import { useCallback, useEffect, useRef, useState } from "react";
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

export const NOTIFICATION_DROPDOWN_PAGE_SIZE = 5;

export function useNotifications(enabled: boolean) {
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const pageRef = useRef(0);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const applyCounts = useCallback((next: NotificationCounts) => {
    setCounts({
      total: next.total,
      pendingOrders: next.pendingOrders,
      pendingReturns: next.pendingReturns,
    });
  }, []);

  const fetchPage = useCallback(async (pageNum: number) => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [countData, result] = await Promise.all([
        notificationApi.unreadCount(),
        notificationApi.list(pageNum, NOTIFICATION_DROPDOWN_PAGE_SIZE),
      ]);
      applyCounts(countData);
      setItems(result.content);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  }, [applyCounts, enabled]);

  const refetch = useCallback(() => {
    void fetchPage(pageRef.current);
  }, [fetchPage]);

  const goToPage = useCallback((nextPage: number) => {
    void fetchPage(nextPage);
  }, [fetchPage]);

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
      void fetchPage(pageRef.current);
      if (isNetworkError(error)) {
        toast.warn("Không kết nối được máy chủ. Thử lại sau vài giây.");
      }
    }
  }, [applyCounts, fetchPage]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    applyCounts({ total: 0, pendingOrders: 0, pendingReturns: 0 });

    try {
      await notificationApi.markAllRead();
      void fetchPage(pageRef.current);
    } catch (error) {
      void fetchPage(pageRef.current);
      if (isNetworkError(error)) {
        toast.warn("Không kết nối được máy chủ. Thử lại sau vài giây.");
      }
    }
  }, [applyCounts, fetchPage]);

  useEffect(() => {
    void fetchPage(0);
  }, [fetchPage]);

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
          toast.info(notification.title, { autoClose: 4000 });
          void fetchPage(pageRef.current);
        }
      },
      setConnected
    );
  }, [applyCounts, enabled, fetchPage]);

  return {
    counts,
    items,
    page,
    totalPages,
    totalElements,
    loading,
    connected,
    refetch,
    goToPage,
    markRead,
    markAllRead,
    totalNotifications: counts.total,
  };
}
