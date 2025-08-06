import React, { useState } from 'react';
import { useFormik } from 'formik';
import { resetPasswordSchema } from '../validations/schemas';
import useFormSubmit from '../hooks/useFormSubmit';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const email = localStorage.getItem('email') || '';

  const { handleSubmit, loading } = useFormSubmit('auth/reset-password', (res) => {
    if (res.status === 1) {
      navigate('/login');
    }
  });

  const formik = useFormik({
    initialValues: {
      email,
      otp_code: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: resetPasswordSchema,
    onSubmit: handleSubmit
  });

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {loading && <Loader />}
        <form onSubmit={formik.handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4 font-bold">Reset Password</h2>

          {/* OTP Code Field */}
          <div className="mb-4">
            <label className="block mb-1">OTP Code</label>
            <input
              type="text"
              name="otp_code"
              onChange={formik.handleChange}
              value={formik.values.otp_code}
              className="w-full border px-3 py-2 rounded"
            />
            {formik.touched.otp_code && formik.errors.otp_code && (
              <p className="text-red-500 text-sm">{formik.errors.otp_code}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4 relative">
            <label className="block mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              onChange={formik.handleChange}
              value={formik.values.password}
              className="w-full border px-3 py-2 rounded"
            />
            <span
              className="absolute right-3 top-9 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm">{formik.errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4 relative">
            <label className="block mb-1">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              onChange={formik.handleChange}
              value={formik.values.confirmPassword}
              className="w-full border px-3 py-2 rounded"
            />
            <span
              className="absolute right-3 top-9 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-red-500 text-sm">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
            Reset Password
          </button>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;
