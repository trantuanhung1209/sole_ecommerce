import type { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/user.type";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { fetchProfile } from "@/store/slices";
import { useEffect } from "react";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
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
