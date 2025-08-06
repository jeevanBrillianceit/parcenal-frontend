import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenValid, getCurrentUser } from '../utils/auth.helper';

export const PublicRoute = ({ children }) => {
  return !isTokenValid() ? children : <Navigate to="/dashboard" />;
};

export const RoleBasedRoute = ({ element, allowedTypes }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !allowedTypes.includes(user.type_id)) {
    return <Navigate to="/profile" />;
  }
  return element;
};

export const PrivateRoute = ({ children, allowedTypes = [] }) => {
  const location = useLocation();
  const user = getCurrentUser();

  const currentPath = location.pathname;
  const isUserTypePage = currentPath === '/user-type';
  const isMatchPage = ['/traveler-match', '/requestor-match'].includes(currentPath);

  if (!isTokenValid()) {
    if (isMatchPage) return children;
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (!user?.type_id && !isUserTypePage) {
    return <Navigate to="/user-type" />;
  }

  if (allowedTypes.length && !allowedTypes.includes(user?.type_id)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};
