import * as Yup from 'yup';

export const signupSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required('Phone is required'),
  password: Yup.string()
    .required("Password is required")
    .min(10, "Must be at least 10 characters")
    .matches(/[A-Z]/, "One capital letter required")
    .matches(/[0-9]/, "One number required")
    .matches(/[^a-zA-Z0-9]/, "One special character required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], "Passwords must match")
    .required("Confirm Password is required")
});

export const otpSchema = Yup.object({
  otp: Yup.string().length(6, "Enter 6-digit OTP").required("OTP is required"),
  email: Yup.string().email().required()
});

export const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required')
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Invalid email').required("Email is required")
});

export const resetPasswordSchema = Yup.object({
  email: Yup.string().email().required(),
  otp_code: Yup.string().required('OTP code is required'),
  password: Yup.string()
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,}$/, 'Password must be 10+ characters with 1 capital, 1 number, and 1 special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
})

export const profileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email().required('Email is required'),
  phone: Yup.string().required('Phone is required'),
  dob: Yup.string().required('Date of Birth is required'),
  gender: Yup.string().required('Gender is required'),
  address: Yup.string().required('Address is required'),
  country: Yup.string().required('Country is required'),
  state: Yup.string().required('State is required'),
  city: Yup.string().required('City is required')
});
