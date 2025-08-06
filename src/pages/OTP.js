import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import useFormSubmit from '../hooks/useFormSubmit';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../components/Header';

const OTP = () => {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || localStorage.getItem('email');
  const queryParams = new URLSearchParams(location.search);
  const redirectBack = queryParams.get('redirectBack');
  const typeId = queryParams.get('type_id');

  const { handleSubmit: verifyOtp, loading: verifying } = useFormSubmit('auth/verify-otp', async () => {
    try {
      const loginRes = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password: localStorage.getItem('password') || ''
      });

      const user = loginRes.data?.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('password');

      const fromPath = location.state?.from;
      const searchData = location.state?.searchData;

      if (!user?.type_id) {
        navigate('/user-type', {
          state: {
            from: fromPath || (user.type_id === 1 ? '/traveler-match' : '/requestor-match'),
            searchData
          }
        });
      } else {
        navigate(fromPath || (user.type_id === 1 ? '/traveler-match' : '/requestor-match'), {
          state: { searchData }
        });
      }
    } catch {
      toast.error('OTP verified. Please login again.');
      navigate('/login');
    }
  });

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling) element.nextSibling.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) return toast.error('Enter valid 6-digit OTP');
    verifyOtp({ email, otp: enteredOtp });
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/resend-otp`, { email });
      toast.success('OTP resent successfully');
      setTimer(60);
      setResendDisabled(true);
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else {
      setResendDisabled(false);
    }
  }, [timer]);

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {(verifying || loading) && <Loader />}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
          <div className="flex justify-between mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="w-10 h-10 text-center border border-gray-300 rounded"
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
              />
            ))}
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Verify OTP</button>

          <div className="text-center mt-4">
            {resendDisabled ? (
              <p className="text-sm text-gray-600">Resend OTP in {timer}s</p>
            ) : (
              <button type="button" onClick={handleResendOtp} className="text-blue-600 text-sm">Resend OTP</button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default OTP;
