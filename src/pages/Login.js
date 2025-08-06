import React, { useState } from 'react';
import { useFormik } from 'formik';
import { loginSchema } from '../validations/schemas';
import useFormSubmit from '../hooks/useFormSubmit';
import Loader from '../components/Loader';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔁 Fallback support for login redirect
  const fallback = JSON.parse(localStorage.getItem('pendingSearch') || '{}');
  const fromPath = location.state?.from || fallback.from;
  const searchData = location.state?.searchData || fallback.searchData;
  const typeId = new URLSearchParams(location.search).get('type_id');

  const { handleSubmit, loading } = useFormSubmit('auth/login', (response, values) => {
    if (response?.status === 1) {
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('email', user.email);
      localStorage.removeItem('pendingSearch'); // ✅ clear after use

      if (user.status_id !== 2) {
        navigate(`/otp`, {
          state: { from: fromPath || (typeId === '1' ? '/traveler-match' : '/requestor-match'), searchData }
        });
      } else if (!user.type_id) {
        navigate('/user-type', {
          state: { from: fromPath || (typeId === '1' ? '/traveler-match' : '/requestor-match'), searchData }
        });
      } else {
        navigate(fromPath || (user.type_id === 1 ? '/traveler-match' : '/requestor-match'), {
          state: { searchData }
        });
      }
    } else if (response?.response?.includes('verify OTP')) {
      localStorage.setItem('email', values.email);
      navigate(`/otp`, {
        state: { from: fromPath || '/profile', searchData }
      });
    }
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: handleSubmit,
  });

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {loading && <Loader />}
        <form onSubmit={formik.handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4 font-bold">Login</h2>

          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              onChange={formik.handleChange}
              value={formik.values.email}
              className="w-full border px-3 py-2 rounded"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm">{formik.errors.email}</p>
            )}
          </div>

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

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
            Login
          </button>

          <div className="text-sm text-center mt-4">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="text-blue-600">
              Reset
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
