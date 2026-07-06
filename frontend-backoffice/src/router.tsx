import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SellerLogin } from './pages/seller/SellerLogin';
import { SellerRegister } from './pages/seller/SellerRegister';
import { AdminLogin } from './pages/admin/AdminLogin';

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
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/',
    element: <Navigate to="/seller/login" replace />,
  },
]);
