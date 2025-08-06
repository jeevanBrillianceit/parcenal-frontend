import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const useFormSubmit = (endpoint, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = values;
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/${endpoint}`, payload);
      const response = res.data;

      if (response.status === 1) {
        toast.success(response.response);
      } else {
        toast.error(response.response);
      }

      onSuccess(response, values); // Pass values to callback for email
    } catch (err) {
      if (
        err.response?.data?.response === 'Your account is not active. Please verify OTP first.'
      ) {
        localStorage.setItem('email', values.email); // Store for OTP page
        navigate('/otp');
      } else {
        toast.error(err.response?.data?.response || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading };
};

export default useFormSubmit;
