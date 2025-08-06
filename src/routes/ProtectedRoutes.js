import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenValid, getCurrentUser } from '../utils/auth.helper';

export const PublicRoute = ({ children }) => {
  const location = useLocation();
  const isMatchPage = ['/traveler-match', '/requestor-match'].includes(location.pathname);

  // ✅ Allow match pages even if user is logged in
  return !isTokenValid() || isMatchPage ? children : <Navigate to="/dashboard" />;
};

export const RoleBasedRoute = ({ element, allowedTypes }) => {
  const user = getCurrentUser();
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

  // For match pages, allow access regardless of user type
  if (isMatchPage) {
    return children;
  }

  if (!user?.type_id && !isUserTypePage) {
    return <Navigate to="/user-type" />;
  }

  // Only check allowedTypes for non-match pages
  if (!isMatchPage && allowedTypes.length && !allowedTypes.includes(user?.type_id)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};