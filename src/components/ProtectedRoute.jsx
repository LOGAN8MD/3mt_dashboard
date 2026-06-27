import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const getStoredUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch {
      localStorage.removeItem('userInfo');
    }
  }

  const token = localStorage.getItem('token');
  return token ? { token } : null;
};

const ProtectedRoute = ({ requireAdmin = false }) => {
  const location = useLocation();
  const user = getStoredUser();

  if (!user?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
