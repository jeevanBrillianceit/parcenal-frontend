import React, { useState } from 'react';
import { useFormik } from 'formik';
import { signupSchema } from '../validations/schemas';
import useFormSubmit from '../hooks/useFormSubmit';
import Loader from '../components/Loader';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Header from '../components/Header';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectBack = queryParams.get('redirectBack'); // traveler-match or requestor-match

  const { handleSubmit, loading } = useFormSubmit('auth/signup', () => {
    localStorage.setItem('email', formik.values.email);
    localStorage.setItem('password', formik.values.password); // store temporarily

    const redirectParams = redirectBack ? { state: { email: formik.values.email }, search: `?redirectBack=${redirectBack}` } : { state: { email: formik.values.email } };
    navigate('/otp', redirectParams);
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: signupSchema,
    onSubmit: handleSubmit
  });

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {loading && <Loader />}
        <form onSubmit={formik.handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4 font-bold">Signup</h2>

          {['name', 'email'].map(field => (
            <div key={field} className="mb-4">
              <label className="block mb-1 capitalize">{field}</label>
              <input
                type="text"
                name={field}
                onChange={formik.handleChange}
                value={formik.values[field]}
                className="w-full border px-3 py-2 rounded"
              />
              {formik.touched[field] && formik.errors[field] && (
                <p className="text-red-500 text-sm">{formik.errors[field]}</p>
              )}
            </div>
          ))}

          <div className="mb-4">
            <label className="block mb-1">Phone</label>
            <PhoneInput
              country={'ca'}
              value={formik.values.phone}
              onChange={(value) => formik.setFieldValue('phone', value)}
              inputProps={{ name: 'phone', required: true }}
              enableSearch={true}
              containerClass="w-full"
              inputClass="!w-full !h-10 !text-base !px-14 !py-2 !border !border-gray-300 !rounded-md focus:!ring-2 focus:!ring-blue-500 focus:!outline-none"
              buttonClass="!border-r !border-gray-300"
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.phone}</p>
            )}
          </div>

          {['password', 'confirmPassword'].map((field) => (
            <div key={field} className="mb-4 relative">
              <label className="block mb-1">
                {field === 'confirmPassword' ? 'Confirm Password' : 'Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name={field}
                onChange={formik.handleChange}
                value={formik.values[field]}
                className="w-full border px-3 py-2 rounded"
              />
              <span
                className="absolute right-3 top-9 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
              {formik.touched[field] && formik.errors[field] && (
                <p className="text-red-500 text-sm">{formik.errors[field]}</p>
              )}
            </div>
          ))}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Signup</button>
          <div className="text-sm text-center mt-4">
            Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default Signup;
