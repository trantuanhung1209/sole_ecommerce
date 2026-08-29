import {
  Edit,
  Power,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/user.type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getRoleLabel } from "@/utils/displayLabels";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEditUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

function UserTable({
  users,
  isLoading,
  onEditUser,
  onToggleStatus,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Không tìm thấy người dùng</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Thử thay đổi bộ lọc hoặc tìm kiếm khác
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return "destructive";
      case "STAFF":
      case "SHOP_MANAGER":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Người dùng</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                {/* User Info */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar || user.googleAuth?.picture}
                        alt={user.fullName}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {user.fullName || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Contact */}
                <TableCell>
                  {user.phone ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Chưa cập nhật
                    </span>
                  )}
                </TableCell>

                {/* Role */}
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    variant={user.isActive ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Hoạt động
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Vô hiệu
                      </>
                    )}
                  </Badge>
                </TableCell>

                {/* Created Date */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {user.createdAt
                      ? format(new Date(user.createdAt), "dd/MM/yyyy", {
                          locale: vi,
                        })
                      : "N/A"}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Toggle Status - not for ADMIN */}
                    {user.role !== "ADMIN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleStatus(user)}
                        title={
                          user.isActive
                            ? "Vô hiệu hóa tài khoản"
                            : "Kích hoạt tài khoản"
                        }
                        className={
                          user.isActive
                            ? "text-destructive hover:text-destructive"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default UserTable;
