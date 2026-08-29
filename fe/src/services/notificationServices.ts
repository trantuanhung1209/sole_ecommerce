import authorizedAxios from "@/utils/authorizedAxios";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type { AppNotification, NotificationCounts } from "@/types/notification.type";

export const notificationApi = {
  list: async (page = 0, size = 20) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<AppNotification>>>("/notifications", {
      params: { page, size },
    });
    return res.data.data;
  },
  recent: async () => {
    const res = await authorizedAxios.get<ApiResponse<AppNotification[]>>("/notifications/recent");
    return res.data.data;
  },
  unreadCount: async () => {
    const res = await authorizedAxios.get<ApiResponse<NotificationCounts>>("/notifications/unread-count");
    return res.data.data;
  },
  markRead: async (notificationId: string) => {
    const res = await authorizedAxios.put<ApiResponse<AppNotification>>(`/notifications/${notificationId}/read`);
    return res.data.data;
  },
  markAllRead: async () => {
    await authorizedAxios.put("/notifications/read-all");
  },
};
