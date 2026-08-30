import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AppInitializer } from "./providers/AppInitializer";

import AuthRoute from "./routes/AuthRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import { UserRole } from "./types/user.type";

import RootLayout from "@/layouts/RootLayout";
import DefaultLayout from "@/layouts/DefaultLayout";
import EmptyLayout from "./layouts/EmptyLayout";
import StaffLayout from "./layouts/StaffLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/Public/Home/Home";
import CategoriesPage from "./pages/Public/Categories/CategoriesPage";
import BrandsPage from "./pages/Public/Brands/BrandsPage";
import NewArrivalsPage from "./pages/Public/NewArrivals/NewArrivalsPage";
import AboutPage from "./pages/Public/About/AboutPage";
import ContactPage from "./pages/Public/Contact/ContactPage";
import ReviewsPage from "./pages/Public/Reviews/ReviewsPage";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import { UserAdminManagement } from "./pages/admin/UserAdminManagement";
import { PaymentSuccess, PaymentError, PaymentCancel } from "./pages/payment";
import ProfilePage from "./pages/private/ProfilePage";
import ProductListPage from "./pages/ecommerce/ProductListPage";
import CategoryProductsPage from "./pages/ecommerce/CategoryProductsPage";
import ProductDetailPage from "./pages/ecommerce/ProductDetailPage";
import CartPage from "./pages/ecommerce/CartPage";
import CheckoutPage from "./pages/ecommerce/CheckoutPage";
import OrderHistoryPage from "./pages/ecommerce/OrderHistoryPage";
import OrderDetailPage from "./pages/ecommerce/OrderDetailPage";
import WishlistPage from "./pages/ecommerce/WishlistPage";
import ReturnRequestPage from "./pages/ecommerce/ReturnRequestPage";
import MyReturnsPage from "./pages/ecommerce/MyReturnsPage";
import MyReturnDetailPage from "./pages/ecommerce/MyReturnDetailPage";
import MyReviewsPage from "./pages/ecommerce/MyReviewsPage";
import AddressBookPage from "./pages/ecommerce/AddressBookPage";
import NotificationsPage from "./pages/ecommerce/NotificationsPage";
import AiChatPage from "./pages/ecommerce/AiChatPage";
import RolePermissionsPage from "./pages/admin/RolePermissions/RolePermissionsPage";
import { RoleGate } from "./components/auth/RoleGate";
import ProductManagementPage from "./pages/admin/ProductManagement/ProductManagementPage";
import ProductDetailAdminPage from "./pages/admin/ProductManagement/ProductDetailAdminPage";
import InventoryManagementPage from "./pages/admin/InventoryManagement/InventoryManagementPage";
import OrderManagementPage from "./pages/admin/OrderManagement/OrderManagementPage";
import OrderDetailAdminPage from "./pages/admin/OrderManagement/OrderDetailAdminPage";
import PromotionManagementPage from "./pages/admin/PromotionManagement/PromotionManagementPage";
import ReturnManagementPage from "./pages/admin/ReturnManagement/ReturnManagementPage";
import ReturnDetailAdminPage from "./pages/admin/ReturnManagement/ReturnDetailAdminPage";
import ReviewManagementPage from "./pages/admin/ReviewManagement/ReviewManagementPage";
import BrandManagementPage from "./pages/admin/BrandManagement/BrandManagementPage";
import CategoryManagementPage from "./pages/admin/CategoryManagement/CategoryManagementPage";
import DashboardStaff from "./pages/staff/DashboardStaff";

const STAFF_ROLES = [
  UserRole.STAFF,
  UserRole.SHOP_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "",
        element: <DefaultLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "products", element: <ProductListPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "categories/:slug", element: <CategoryProductsPage /> },
          { path: "brands", element: <BrandsPage /> },
          { path: "new-arrivals", element: <NewArrivalsPage /> },
          { path: "about", element: <AboutPage /> },
          { path: "contact", element: <ContactPage /> },
          { path: "reviews", element: <ReviewsPage /> },
          { path: "products/:idOrSlug", element: <ProductDetailPage /> },
          {
            path: "profile",
            element: (
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "cart",
            element: <CartPage />,
          },
          {
            path: "checkout",
            element: (
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "orders",
            element: (
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "orders/:orderId",
            element: (
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "orders/:orderId/return",
            element: (
              <ProtectedRoute>
                <ReturnRequestPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "wishlist",
            element: (
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "returns",
            element: (
              <ProtectedRoute>
                <MyReturnsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "returns/:returnId",
            element: (
              <ProtectedRoute>
                <MyReturnDetailPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "my-reviews",
            element: (
              <ProtectedRoute>
                <MyReviewsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "addresses",
            element: (
              <ProtectedRoute>
                <AddressBookPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "notifications",
            element: (
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "ai-chat",
            element: <AiChatPage />,
          },
        ],
      },
      { path: "payment/success", element: <PaymentSuccess /> },
      { path: "payment/error", element: <PaymentError /> },
      { path: "payment/cancel", element: <PaymentCancel /> },
      {
        path: "register",
        element: (
          <AuthRoute>
            <EmptyLayout />
          </AuthRoute>
        ),
        children: [{ index: true, element: <Register /> }],
      },
      {
        path: "login",
        element: (
          <AuthRoute>
            <EmptyLayout />
          </AuthRoute>
        ),
        children: [{ index: true, element: <Login /> }],
      },
      {
        path: "forgot-password",
        element: (
          <AuthRoute>
            <EmptyLayout />
          </AuthRoute>
        ),
        children: [{ index: true, element: <ForgotPassword /> }],
      },
      {
        path: "admin",
        element: <ProtectedRoute roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} />,
        children: [
          {
            path: "",
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardAdmin /> },
              { path: "users", element: <UserAdminManagement /> },
              {
                path: "role-permissions",
                element: (
                  <RoleGate roles={[UserRole.SUPER_ADMIN]} redirectTo="/admin">
                    <RolePermissionsPage />
                  </RoleGate>
                ),
              },
              { path: "products", element: <ProductManagementPage /> },
              { path: "products/:productId", element: <ProductDetailAdminPage /> },
              { path: "brands", element: <BrandManagementPage /> },
              { path: "categories", element: <CategoryManagementPage /> },
              { path: "inventory", element: <InventoryManagementPage /> },
              { path: "orders", element: <OrderManagementPage /> },
              { path: "orders/:orderId", element: <OrderDetailAdminPage /> },
              { path: "promotions", element: <PromotionManagementPage /> },
              { path: "returns", element: <ReturnManagementPage /> },
              { path: "returns/:returnId", element: <ReturnDetailAdminPage /> },
              { path: "reviews", element: <ReviewManagementPage /> },
            ],
          },
        ],
      },
      {
        path: "staff",
        element: <ProtectedRoute roles={STAFF_ROLES} />,
        children: [
          {
            path: "",
            element: <StaffLayout />,
            children: [
              { index: true, element: <DashboardStaff /> },
              { path: "products", element: <ProductManagementPage /> },
              { path: "products/:productId", element: <ProductDetailAdminPage /> },
              { path: "inventory", element: <InventoryManagementPage /> },
              { path: "orders", element: <OrderManagementPage /> },
              { path: "orders/:orderId", element: <OrderDetailAdminPage /> },
              { path: "returns", element: <ReturnManagementPage /> },
              { path: "returns/:returnId", element: <ReturnDetailAdminPage /> },
              { path: "reviews", element: <ReviewManagementPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <>
      <AppInitializer />
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
