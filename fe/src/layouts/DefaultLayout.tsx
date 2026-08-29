import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/Public/Header/Header";

const DefaultLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Outlet />
    </div>
  );
};

export default DefaultLayout;
