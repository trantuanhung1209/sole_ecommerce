import UserProfile from "@/components/layouts/Public/Header/components/UserProfile";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/hooks/useRedux";

function HeaderActions() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="flex items-center space-x-3">
      <NotificationBell />
      <UserProfile
        user={{
          name: user.fullName,
          email: user.email,
          // Priority: avatar > googleAuth.picture > empty
          avatar: user.avatar || user.googleAuth?.picture || "",
          role: user.role,
          lastLogin: user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleString()
            : "N/A",
          updatedAt: user.updatedAt,
        }}
      />
    </div>
  );
}

export default HeaderActions;
