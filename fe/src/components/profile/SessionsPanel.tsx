import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { authServices } from "@/services/authServices";

type Session = {
  sessionId: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  expiresAt?: string;
  current?: boolean;
};

export function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authServices
      .listSessions()
      .then(setSessions)
      .catch(() => toast.error("Không thể tải phiên đăng nhập"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (sessionId: string) => {
    await authServices.revokeSession(sessionId);
    toast.success("Đã đăng xuất phiên");
    load();
  };

  const revokeOthers = async () => {
    await authServices.revokeOtherSessions();
    toast.success("Đã đăng xuất các phiên khác");
    load();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải phiên...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Phiên đăng nhập</h3>
        <Button variant="outline" size="sm" onClick={revokeOthers}>
          Đăng xuất thiết bị khác
        </Button>
      </div>
      {sessions.map((session) => (
        <div key={session.sessionId} className="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div>
            <p className="font-medium">{session.userAgent || "Thiết bị không xác định"}</p>
            <p className="text-muted-foreground">{session.ip || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(session.createdAt).toLocaleString("vi-VN")}
              {session.current ? " · Phiên hiện tại" : ""}
            </p>
          </div>
          {!session.current ? (
            <Button variant="ghost" size="sm" onClick={() => revoke(session.sessionId)}>
              Thu hồi
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
