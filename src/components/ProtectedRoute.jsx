import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_ROLE, DASHBOARD_ROLES, getDashboardHomePath } from '../utils/roles';

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

const ProtectedRoute = ({ requireAdmin = false, allowedRoles = DASHBOARD_ROLES }) => {
  const location = useLocation();
  const user = getStoredUser();
  const routeAllowedRoles = requireAdmin ? [ADMIN_ROLE] : allowedRoles;

  if (!user?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!routeAllowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardHomePath(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
