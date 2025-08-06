import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Loader from '../components/Loader';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const UserType = () => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user'));
  const queryParams = new URLSearchParams(location.search);
  const redirectBack = queryParams.get('redirectBack');

  useEffect(() => {
    if (!user) {
      toast.error('Please login first');
      navigate('/login');
    }
  }, [user, navigate]);

  const typeOptions = [
    { id: 1, label: "I'm Travelling" },
    { id: 2, label: "I need something delivered" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type) {
      toast.error('Please select a user type');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/user-type`, {
        user_id: user.id,
        type_id: type
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.data.status === 1) {
        const updatedUser = { ...user, type_id: type };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('User type saved!');

        // Determine where to redirect
        const targetPath = location.state?.from || (type === 1 ? '/traveler-match' : '/requestor-match');
        navigate(targetPath, {
          state: {
            searchData: location.state?.searchData
          }
        });
      } else {
        toast.error(res.data.response);
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {loading && <Loader />}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-6 font-bold">What do you want to do?</h2>

          <div className="mb-4">
            {typeOptions.map(option => (
              <label key={option.id} className="block mb-2">
                <input
                  type="radio"
                  name="type"
                  value={option.id}
                  checked={type === option.id}
                  onChange={() => setType(option.id)}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Continue
          </button>
        </form>
      </div>
    </>
  );
};

export default UserType;
