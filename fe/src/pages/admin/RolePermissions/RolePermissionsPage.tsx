import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rbacApi } from "@/services/ecommerceServices";
import {
  getPermissionGroupLabel,
  getPermissionLabel,
  getRoleLabel,
} from "@/utils/displayLabels";
import type { PermissionMatrix } from "@/types/ecommerce.type";

export default function RolePermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [draft, setDraft] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    rbacApi.matrix().then((data) => {
      setMatrix(data);
      const nextDraft: Record<string, Record<string, boolean>> = {};
      data.permissions.forEach((permission) => {
        nextDraft[permission.code] = { ...permission.enabledByRole };
      });
      setDraft(nextDraft);
    });
  }, []);

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

  const save = async () => {
    for (const [role, permissions] of Object.entries(changedByRole)) {
      if (permissions.length > 0) {
        await rbacApi.updateRole(role, permissions, "Updated from role permission matrix UI");
      }
    }
    toast.success("Permissions updated");
    const refreshed = await rbacApi.matrix();
    setMatrix(refreshed);
    const nextDraft: Record<string, Record<string, boolean>> = {};
    refreshed.permissions.forEach((permission) => {
      nextDraft[permission.code] = { ...permission.enabledByRole };
    });
    setDraft(nextDraft);
  };

  if (!matrix) return <div className="p-6">Đang tải phân quyền...</div>;

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vai trò & quyền hạn</h1>
          <p className="text-sm text-muted-foreground">
            Siêu quản trị có thể cập nhật quyền theo vai trò từ ma trận bên dưới.
          </p>
        </div>
        <Button onClick={save}>Lưu thay đổi</Button>
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
            {matrix.permissions.map((permission) => (
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
    </main>
  );
}
