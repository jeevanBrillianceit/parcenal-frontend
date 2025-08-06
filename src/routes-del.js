import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import OTP from './pages/OTP';
// import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserType from './pages/UserType';
import Profile from './pages/Profile';

const AppRoutes = () => (
  <Routes>
    <Route path="/signup" element={<Signup />} />
    <Route path="/otp" element={<OTP />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/user-type" element={<UserType />} />
    <Route path="/profile" element={<Profile />} />
    {/* <Route path="/dashboard" element={<Dashboard />} /> */}
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;
