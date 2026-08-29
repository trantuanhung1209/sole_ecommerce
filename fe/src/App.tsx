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
import ReturnManagementPage from "./pages/admin/ReturnManagement/ReturnManagementPage";
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
          { path: "categories/:slug", element: <CategoryProductsPage /> },
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
            element: (
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            ),
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
            path: "reviews",
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
              { path: "returns", element: <ReturnManagementPage /> },
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
              { path: "returns", element: <ReturnManagementPage /> },
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
