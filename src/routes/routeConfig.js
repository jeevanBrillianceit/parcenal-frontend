import React from 'react';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import UserType from '../pages/UserType';
import Traveler from '../pages/Traveler';
import Requester from '../pages/Requester';
import Profile from '../pages/Profile';
import TravelerMatchMaking from '../pages/TravelerMatchMaking';
import RequesterMatchMaking from '../pages/RequesterMatchMaking';
import { PrivateRoute, PublicRoute, RoleBasedRoute } from './ProtectedRoutes';
import Chat from '../pages/Chat';
import OTP from '../pages/OTP';
import ConnectionRequests from '../pages/ConnectionRequests';

export const publicRoutes = [
  { path: '/login', element: <PublicRoute><Login /></PublicRoute> },
  { path: '/signup', element: <PublicRoute><Signup /></PublicRoute> },
  { path: '/forgot-password', element: <PublicRoute><ForgotPassword /></PublicRoute> },
  { path: '/reset-password', element: <PublicRoute><ResetPassword /></PublicRoute> },
  { path: '/otp', element: <PublicRoute><OTP /></PublicRoute> },
  
  { path: '/traveler-match', element: <TravelerMatchMaking /> },
  { path: '/requestor-match', element: <RequesterMatchMaking /> }
];

export const privateRoutes = [
  { path: '/user-type', element: <PrivateRoute><UserType /></PrivateRoute> },
  { path: '/profile', element: <PrivateRoute><Profile /></PrivateRoute> },
  { path: '/traveler', element: <PrivateRoute allowedTypes={[1]}><Traveler /></PrivateRoute> },
  { path: '/requestor', element: <PrivateRoute allowedTypes={[2]}><Requester /></PrivateRoute> },
  { path: '/chat', element: <PrivateRoute><Chat /></PrivateRoute> },
  { path: '/chat/:userId', element: <PrivateRoute><Chat /></PrivateRoute> },
  { path: '/connections', element: <PrivateRoute><ConnectionRequests /></PrivateRoute> },
];
