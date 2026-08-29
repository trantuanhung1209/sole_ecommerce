import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import type { UserRole } from "@/types/user.type";

type RoleGateProps = {
  roles: UserRole[];
  children: ReactNode;
  redirectTo?: string;
};

export function RoleGate({ roles, children, redirectTo = "/" }: RoleGateProps) {
  const { role } = useRoleAccess();
  if (!role || !roles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
