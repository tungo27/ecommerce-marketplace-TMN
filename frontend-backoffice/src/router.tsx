import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SellerLogin } from './pages/seller/SellerLogin';
import { SellerRegister } from './pages/seller/SellerRegister';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RoleGuard } from './components/RoleGuard';
import { OAuthCallback } from './pages/OAuthCallback';

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
        path: '/seller/dashboard',
        element: <SellerDashboard />,
      },
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
