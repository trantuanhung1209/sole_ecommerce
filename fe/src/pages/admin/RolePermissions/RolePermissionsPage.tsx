import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rbacApi } from "@/services/ecommerceServices";
import {
  getPermissionGroupLabel,
  getPermissionLabel,
  getRoleLabel,
} from "@/utils/displayLabels";
import type { AuditLogEntry, PermissionMatrix } from "@/types/ecommerce.type";

export default function RolePermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [draft, setDraft] = useState<Record<string, Record<string, boolean>>>({});
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [reason, setReason] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  const loadMatrix = () =>
    rbacApi.matrix().then((data) => {
      setMatrix(data);
      const nextDraft: Record<string, Record<string, boolean>> = {};
      data.permissions.forEach((permission) => {
        nextDraft[permission.code] = { ...permission.enabledByRole };
      });
      setDraft(nextDraft);
    });

  useEffect(() => {
    void loadMatrix();
  }, []);

  const groups = useMemo(() => {
    if (!matrix) return [];
    return Array.from(new Set(matrix.permissions.map((p) => p.group))).sort();
  }, [matrix]);

  const filteredPermissions = useMemo(() => {
    if (!matrix) return [];
    if (groupFilter === "ALL") return matrix.permissions;
    return matrix.permissions.filter((p) => p.group === groupFilter);
  }, [matrix, groupFilter]);

  const changedByRole = useMemo(() => {
    if (!matrix) return {};
    const changes: Record<string, { code: string; enabled: boolean }[]> = {};
    matrix.roles.forEach((role) => {
      changes[role] = matrix.permissions
        .filter((permission) => draft[permission.code]?.[role] !== permission.enabledByRole[role])
        .map((permission) => ({ code: permission.code, enabled: Boolean(draft[permission.code]?.[role]) }));
    });
    return changes;
  }, [draft, matrix]);

  const hasChanges = Object.values(changedByRole).some((items) => items.length > 0);

  const resetDraft = () => {
    if (!matrix) return;
    const nextDraft: Record<string, Record<string, boolean>> = {};
    matrix.permissions.forEach((permission) => {
      nextDraft[permission.code] = { ...permission.enabledByRole };
    });
    setDraft(nextDraft);
    toast.info("Đã khôi phục ma trận gốc");
  };

  const save = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do thay đổi quyền");
      return;
    }
    for (const [role, permissions] of Object.entries(changedByRole)) {
      if (permissions.length > 0) {
        await rbacApi.updateRole(role, permissions, reason.trim());
      }
    }
    toast.success("Permissions updated");
    setReason("");
    await loadMatrix();
    if (showAudit) {
      const logs = await rbacApi.auditLogs();
      setAuditLogs(logs);
    }
  };

  const toggleAudit = async () => {
    if (!showAudit) {
      const logs = await rbacApi.auditLogs();
      setAuditLogs(logs);
    }
    setShowAudit((v) => !v);
  };

  if (!matrix) return <div className="p-6">Đang tải phân quyền...</div>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vai trò & quyền hạn</h1>
          <p className="text-sm text-muted-foreground">
            Siêu quản trị cập nhật quyền theo vai trò. Thay đổi có hiệu lực sau khi lưu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={resetDraft} disabled={!hasChanges}>
            Hoàn tác
          </Button>
          <Button variant="outline" onClick={toggleAudit}>
            {showAudit ? "Ẩn audit" : "Lịch sử audit"}
          </Button>
          <Button onClick={save} disabled={!hasChanges}>
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-sm font-medium">Nhóm quyền</label>
          <select
            className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {getPermissionGroupLabel(g)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="text-sm font-medium">Lý do thay đổi (bắt buộc khi lưu)</label>
          <Input
            className="mt-1"
            placeholder="VD: Bổ sung quyền duyệt catalog cho Shop Manager"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quyền hạn</TableHead>
              {matrix.roles.map((role) => (
                <TableHead key={role}>{getRoleLabel(role)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map((permission) => (
              <TableRow key={permission.code}>
                <TableCell>
                  <div className="font-medium">{getPermissionLabel(permission.code)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getPermissionGroupLabel(permission.group)}
                  </div>
                </TableCell>
                {matrix.roles.map((role) => {
                  const disabled = role === "SUPER_ADMIN" && permission.code === "MANAGE_ROLE_PERMISSIONS";
                  return (
                    <TableCell key={`${permission.code}-${role}`}>
                      <Switch
                        checked={Boolean(draft[permission.code]?.[role])}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          setDraft((current) => ({
                            ...current,
                            [permission.code]: { ...current[permission.code], [role]: checked },
                          }))
                        }
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showAudit && (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-3">Lịch sử thay đổi quyền (100 mới nhất)</h2>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bản ghi audit.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {auditLogs.map((log) => (
                <li key={log.auditLogId} className="border-b pb-2">
                  <span className="font-medium">{log.action}</span>
                  {log.targetId && <span className="text-muted-foreground"> · {log.targetId}</span>}
                  {log.reason && <p className="text-muted-foreground">{log.reason}</p>}
                  {log.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
