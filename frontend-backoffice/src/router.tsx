import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SellerLogin } from './pages/seller/SellerLogin';
import { SellerRegister } from './pages/seller/SellerRegister';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const router = createBrowserRouter([
  {
    path: '/seller/login',
    element: <SellerLogin />,
  },
  {
    path: '/seller/register',
    element: <SellerRegister />,
  },
  {
    path: '/seller/dashboard',
    element: <SellerDashboard />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/',
    element: <Navigate to="/seller/login" replace />,
  },
]);
