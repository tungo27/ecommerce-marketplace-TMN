import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SellerLogin } from './pages/seller/SellerLogin';
import { SellerRegister } from './pages/seller/SellerRegister';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProductModerationPage } from './pages/admin/ProductModerationPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { UserManagement } from './pages/admin/UserManagement';
import { SellerDetailPage } from './pages/admin/SellerDetailPage';
import { OrderManagement } from './pages/admin/OrderManagement';
import { TransactionPage } from './pages/admin/TransactionPage';
import { ReviewModeration } from './pages/admin/ReviewModeration';
import { AdminLayout } from './layouts/AdminLayout';
import { RoleGuard } from './components/RoleGuard';
import { OAuthCallback } from './pages/OAuthCallback';
import { CreateProduct } from './pages/seller/CreateProduct';
import { ProductList } from './pages/seller/ProductList';
import { EditProduct } from './pages/seller/EditProduct';
import { OrdersPage } from './pages/seller/OrdersPage';
import { ReviewsPage } from './pages/seller/ReviewsPage';
import { SellerLayout } from './layouts/SellerLayout';
import { AnalyticsPage } from './pages/seller/AnalyticsPage';
import { StoreProfile } from './pages/seller/StoreProfile';
import { Settings } from './pages/seller/Settings';

import { CategoryManagement } from './pages/admin/CategoryManagement';
import { StorefrontManagement } from './pages/admin/StorefrontManagement';
import { DisputeManagement } from './pages/admin/DisputeManagement';

export const router = createBrowserRouter([
  // Public routes
  { path: '/seller/login', element: <SellerLogin /> },
  { path: '/seller/register', element: <SellerRegister /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/oauth-callback', element: <OAuthCallback /> },

  // Protected: SELLER or ADMIN can access seller dashboard
  {
    element: <RoleGuard allowedRoles={['SELLER', 'ADMIN']} redirectPath="/seller/login" />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          { path: '/seller/dashboard', element: <SellerDashboard /> },
          { path: '/seller/products/new', element: <CreateProduct /> },
          { path: '/seller/products', element: <ProductList /> },
          { path: '/seller/products/:id/edit', element: <EditProduct /> },
          { path: '/seller/orders', element: <OrdersPage /> },
          { path: '/seller/reviews', element: <ReviewsPage /> },
          { path: '/seller/analytics', element: <AnalyticsPage /> },
          { path: '/seller/profile', element: <StoreProfile /> },
          { path: '/seller/settings', element: <Settings /> },
        ],
      },
    ],
  },

  // Protected: ADMIN only — full Admin Portal with AdminLayout
  {
    element: <RoleGuard allowedRoles={['ADMIN']} redirectPath="/admin/login" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboard /> },
          { path: '/admin/moderation', element: <ProductModerationPage /> },
          { path: '/admin/categories', element: <CategoryManagement /> },
          { path: '/admin/storefront', element: <StorefrontManagement /> },
          { path: '/admin/disputes', element: <DisputeManagement /> },
          { path: '/admin/audit-logs', element: <AuditLogPage /> },
          { path: '/admin/users', element: <UserManagement /> },
          { path: '/admin/sellers/:id', element: <SellerDetailPage /> },
          { path: '/admin/orders', element: <OrderManagement /> },
          { path: '/admin/transactions', element: <TransactionPage /> },
          { path: '/admin/reviews', element: <ReviewModeration /> },
        ],
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/seller/login" replace /> },
]);
