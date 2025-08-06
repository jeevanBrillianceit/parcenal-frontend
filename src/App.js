import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  BrowserRouter,
  useLocation,
} from 'react-router-dom';
import { PublicRoute, PrivateRoute } from './routes/ProtectedRoutes';
import { publicRoutes, privateRoutes } from './routes/routeConfig';
import Header from './components/Header';
import Toast from './components/Toast';
import { isTokenValid } from './utils/auth.helper';
import './index.css';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route
        path="/"
        element={
          isTokenValid() ? <Navigate to="/profile" /> : <Navigate to="/login" />
        }
      />

      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PublicRoute>{element}</PublicRoute>}
        />
      ))}

      {privateRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <PrivateRoute>
              <>
                <Header />
                {element}
              </>
            </PrivateRoute>
          }
        />
      ))}

      <Route path="*" element={<div className="p-4">404 Not Found</div>} />
    </Routes>
  );
};

const App = () => {
  // Only wrap in BrowserRouter on the client
  if (typeof window !== 'undefined') {
    return (
      <BrowserRouter>
        <Toast />
        <AppRoutes />
      </BrowserRouter>
    );
  }

  // On server, router will be passed by server.js using StaticRouter
  return (
    <>
      <Toast />
      <AppRoutes />
    </>
  );
};

export default App;
