import { useAppSelector } from "@/hooks/useRedux";
import HeaderBreadcrumb from "./HeaderBreadcrumb";

interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface HeaderTitleProps {
  breadcrumbItems?: BreadcrumbItemData[];
}

function HeaderTitle({ breadcrumbItems }: HeaderTitleProps) {
  const { user } = useAppSelector((state) => state.auth);
  return (
    <div className="flex flex-col space-y-1.5">
      {/* Breadcrumb Navigation */}
      {breadcrumbItems && <HeaderBreadcrumb items={breadcrumbItems} />}

      {/* Dynamic User Greeting */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-muted-foreground">
          {(() => {
            const hour = new Date().getHours();
            if (hour < 12) return "Chào buổi sáng,";
            if (hour < 17) return "Chào buổi chiều,";
            return "Chào buổi tối,";
          })()}
        </span>
        <span className="font-semibold text-foreground">
          {user?.fullName || "Admin"}!
        </span>
      </div>
    </div>
  );
}

export default HeaderTitle;
