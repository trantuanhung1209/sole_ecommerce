import { Outlet } from "react-router-dom";

const EmptyLayout = () => {
  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-background">
      <div className="h-full w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default EmptyLayout;
