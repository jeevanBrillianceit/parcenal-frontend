import React, { useState, useEffect } from 'react';
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

  const queryParams = new URLSearchParams(location.search);
  const redirectBack = queryParams.get('redirectBack');
  const typeId = queryParams.get('type_id');

  // ✅ Determine redirection target after login/OTP
  const getRedirectPath = () => {
    if (location.state?.from) {
      return location.state.from;
    }
    if (redirectBack && typeId) {
      if (typeId === '1') return '/traveler-match';
      if (typeId === '2') return '/requestor-match';
    }
    return '/profile';
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.status_id !== 2) {
        navigate(`/otp?redirectBack=${redirectBack || ''}&type_id=${typeId || ''}`);
      } else if (!user.type_id || user.type_id === null) {
        navigate('/user-type', {
          state: {
            from: location.state?.from,
            searchData: location.state?.searchData
          }
        });
      } else {
        navigate(getRedirectPath(), {
          state: {
            searchData: location.state?.searchData
          }
        });
      }
    }
  }, [navigate, redirectBack, typeId]);

  const { handleSubmit, loading } = useFormSubmit('auth/login', (response, values) => {
    if (response?.status === 1) {
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('email', user.email);

      // Check if we have search data to restore
      const searchData = location.state?.searchData;
      const fromPath = location.state?.from;

      if (user.status_id !== 2) {
        navigate(`/otp`, { 
          state: { 
            from: fromPath || '/profile',
            searchData 
          } 
        });
      } else if (!user.type_id) {
        navigate('/user-type', { 
          state: { 
            from: fromPath || '/profile',
            searchData 
          } 
        });
      } else {
        // Redirect to either the original path or profile
        navigate(fromPath || '/profile', { 
          state: { searchData } 
        });
      }
    } else if (response?.response?.includes('verify OTP')) {
      localStorage.setItem('email', values.email);
      navigate(`/otp`, { 
        state: { 
          from: location.state?.from || '/profile',
          searchData: location.state?.searchData 
        } 
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
