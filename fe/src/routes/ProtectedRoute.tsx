import type { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/user.type";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { fetchProfile } from "@/store/slices";
import { useEffect } from "react";
import { SolePageLoader } from "@/components/shared/SolePageLoader";

interface Props {
  children?: JSX.Element;
  role?: UserRole;
  roles?: UserRole[];
}

const ProtectedRoute = ({ children, role, roles }: Props) => {
  const { user, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const hasLoginFlag = localStorage.getItem("userLoggedIn") === "true";
    if (hasLoginFlag && !user && !loading) {
      dispatch(fetchProfile());
    }
  }, [dispatch, user, loading]);

  const hasLoginFlag = localStorage.getItem("userLoggedIn") === "true";

  if (!hasLoginFlag) {
    return <Navigate to="/login" replace />;
  }

  if (hasLoginFlag && !user && loading) {
    return <SolePageLoader fullScreen label="Đang xác thực phiên đăng nhập..." />;
  }

  if (hasLoginFlag && !user && !loading) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = roles ?? (role ? [role] : undefined);
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
