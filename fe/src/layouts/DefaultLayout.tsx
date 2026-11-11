import { Outlet } from "react-router-dom";
import Footer from "@/components/layouts/Public/Footer/Footer";
import Header from "@/components/layouts/Public/Header/Header";

const DefaultLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
