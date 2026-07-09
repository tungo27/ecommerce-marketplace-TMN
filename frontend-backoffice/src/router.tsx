import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SellerLogin } from './pages/seller/SellerLogin';
import { SellerRegister } from './pages/seller/SellerRegister';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RoleGuard } from './components/RoleGuard';
import { OAuthCallback } from './pages/OAuthCallback';
import { CreateProduct } from './pages/seller/CreateProduct';
import { ProductList } from './pages/seller/ProductList';
import { EditProduct } from './pages/seller/EditProduct';
import { OrdersPage } from './pages/seller/OrdersPage';
import { SellerLayout } from './layouts/SellerLayout';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/seller/login',
    element: <SellerLogin />,
  },
  {
    path: '/seller/register',
    element: <SellerRegister />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/oauth-callback',
    element: <OAuthCallback />,
  },

  // Protected: SELLER or ADMIN can access seller dashboard
  {
    element: <RoleGuard allowedRoles={['SELLER', 'ADMIN']} redirectPath="/seller/login" />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          {
            path: '/seller/dashboard',
            element: <SellerDashboard />,
          },
          {
            path: '/seller/products/new',
            element: <CreateProduct />,
          },
          {
            path: '/seller/products',
            element: <ProductList />,
          },
          {
            path: '/seller/products/:id/edit',
            element: <EditProduct />,
          },
          {
            path: '/seller/orders',
            element: <OrdersPage />,
          },
        ]
      }
    ],
  },

  // Protected: ADMIN only can access admin dashboard
  {
    element: <RoleGuard allowedRoles={['ADMIN']} redirectPath="/admin/login" />,
    children: [
      {
        path: '/admin/dashboard',
        element: <AdminDashboard />,
      },
    ],
  },

  // Default redirect
  {
    path: '/',
    element: <Navigate to="/seller/login" replace />,
  },
]);
