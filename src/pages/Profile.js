import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { Country, State, City } from 'country-state-city';
import { profileSchema } from '../validations/schemas';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      address: '',
      country: '',
      state: '',
      city: '',
      profileImage: null,
      coverImage: null,
      type_id: '1'
    },
    validationSchema: profileSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      try {
        const countryName = Country.getCountryByCode(values.country)?.name || '';
        const stateName = State.getStateByCodeAndCountry(values.state, values.country)?.name || '';

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('phone', values.phone);
        formData.append('dob', values.dob);
        formData.append('gender', values.gender);
        formData.append('address', values.address);
        formData.append('country', countryName);
        formData.append('state', stateName);
        formData.append('city', values.city);
        formData.append('type_id', values.type_id);

        // Only append files if they're File objects
        if (values.profileImage instanceof File) {
          formData.append('profileImage', values.profileImage);
        } else if (typeof values.profileImage === 'string') {
          // If it's a string (existing URL), don't append it
        }

        if (values.coverImage instanceof File) {
          formData.append('coverImage', values.coverImage);
        } else if (typeof values.coverImage === 'string') {
          // If it's a string (existing URL), don't append it
        }

        const response = await axiosInstance.post('/user/update-profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        toast.success('Profile updated successfully');

        // Update local storage with new user data
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...existingUser,
          name: values.name,
          email: values.email,
          phone: values.phone,
          type_id: parseInt(values.type_id)
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update previews with new image URLs if they were uploaded
        if (response.data?.data?.profile_image) {
          setProfilePreview(response.data.data.profile_image);
          formik.setFieldValue('profileImage', response.data.data.profile_image);
        }
        if (response.data?.data?.cover_image) {
          setCoverPreview(response.data.data.cover_image);
          formik.setFieldValue('coverImage', response.data.data.cover_image);
        }

      } catch (error) {
        console.error('Profile update error:', error);
        toast.error(error.response?.data?.message || 'Failed to update profile');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const getCountryCode = (countryName) => {
    const country = Country.getAllCountries().find(c => c.name === countryName);
    return country?.isoCode || '';
  };

  const getStateCode = (stateName, countryCode) => {
    const state = State.getStatesOfCountry(countryCode).find(
      s => s.name === stateName || s.isoCode === stateName
    );
    return state?.isoCode || '';
  };

  const handleFileChange = (field, e) => {
    const file = e.currentTarget.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Set the field value
    formik.setFieldValue(field, file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      if (field === 'profileImage') {
        setProfilePreview(reader.result);
      } else {
        setCoverPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/user/get-profile');
      const profile = res.data?.data;

      if (profile) {
        const countryCode = getCountryCode(profile.country);
        const stateCode = getStateCode(profile.state, countryCode);

        const fetchedStates = State.getStatesOfCountry(countryCode);
        const fetchedCities = City.getCitiesOfState(countryCode, stateCode);

        setStates(fetchedStates);
        setCities(fetchedCities);

        // Set image previews if they exist
        if (profile.profile_image) {
          setProfilePreview(profile.profile_image);
        }
        if (profile.cover_image) {
          setCoverPreview(profile.cover_image);
        }

        formik.setValues({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dob: formatDate(profile.dob),
          gender: profile.gender || '',
          address: profile.address || '',
          country: countryCode,
          state: stateCode,
          city: profile.city || '',
          profileImage: profile.profile_image || null,
          coverImage: profile.cover_image || null,
          type_id: String(profile.type_id || '1')
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCountries(Country.getAllCountries());
    fetchProfile();
  }, []);

  useEffect(() => {
    if (formik.values.country) {
      const stateList = State.getStatesOfCountry(formik.values.country);
      setStates(stateList);

      const validState = stateList.some(s => s.isoCode === formik.values.state);
      if (!validState) {
        formik.setFieldValue('state', '');
        setCities([]);
        formik.setFieldValue('city', '');
      }
    } else {
      setStates([]);
      formik.setFieldValue('state', '');
      setCities([]);
      formik.setFieldValue('city', '');
    }
  }, [formik.values.country]);

  useEffect(() => {
    if (formik.values.country && formik.values.state) {
      const cityList = City.getCitiesOfState(formik.values.country, formik.values.state);
      setCities(cityList);

      const validCity = cityList.some(c => c.name === formik.values.city);
      if (!validCity) {
        formik.setFieldValue('city', '');
      }
    } else {
      setCities([]);
      formik.setFieldValue('city', '');
    }
  }, [formik.values.state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      {loading && <Loader />}
      <form onSubmit={formik.handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl mb-6 font-bold text-center">Profile Settings</h2>

        {/* Cover Image Preview */}
        <div className="mb-6 relative">
          <div className="h-48 w-full bg-gray-200 rounded-lg overflow-hidden">
            {coverPreview ? (
              <img 
                src={coverPreview} 
                alt="Cover preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Cover Image
              </div>
            )}
          </div>
          <label className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-gray-800 font-medium py-1 px-3 rounded-md text-sm cursor-pointer">
            Change Cover
            <input
              type="file"
              name="coverImage"
              accept="image/*"
              onChange={(e) => handleFileChange('coverImage', e)}
              className="hidden"
            />
          </label>
        </div>

        {/* Profile Image Preview */}
        <div className="flex justify-center -mt-16 mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
              {profilePreview ? (
                <img 
                  src={profilePreview} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Profile
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-white/80 hover:bg-white text-gray-800 font-medium py-1 px-3 rounded-full text-sm cursor-pointer">
              Change
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={(e) => handleFileChange('profileImage', e)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.phone}</p>
            )}
          </div>

          {/* DOB */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formik.values.dob}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {formik.touched.dob && formik.errors.dob && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.dob}</p>
            )}
          </div>

          {/* Gender */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formik.values.gender}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {formik.touched.gender && formik.errors.gender && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.gender}</p>
            )}
          </div>

          {/* User Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type_id"
                  value="1"
                  checked={formik.values.type_id === '1'}
                  onChange={formik.handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Traveler</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type_id"
                  value="2"
                  checked={formik.values.type_id === '2'}
                  onChange={formik.handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Requestor</span>
              </label>
            </div>
          </div>

          {/* Country */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              name="country"
              value={formik.values.country}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Country</option>
              {countries.map(c => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
            {formik.touched.country && formik.errors.country && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.country}</p>
            )}
          </div>

          {/* State */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              name="state"
              value={formik.values.state}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={!formik.values.country}
            >
              <option value="">Select State</option>
              {states.map(s => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </select>
            {formik.touched.state && formik.errors.state && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.state}</p>
            )}
          </div>

          {/* City */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={!formik.values.state}
            >
              <option value="">Select City</option>
              {cities.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {formik.touched.city && formik.errors.city && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.city}</p>
            )}
          </div>

          {/* Address */}
          <div className="mb-4 col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {formik.touched.address && formik.errors.address && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.address}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading || formik.isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;