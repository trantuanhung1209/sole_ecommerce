import { Outlet } from "react-router-dom";

const EmptyLayout = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default EmptyLayout;
