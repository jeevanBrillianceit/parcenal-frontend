import React from "react";
import { useFormik } from "formik";
import { forgotPasswordSchema } from "../validations/schemas";
import useFormSubmit from "../hooks/useFormSubmit";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const ForgotPassword = () => {
    const navigate = useNavigate();

    const { handleSubmit, loading } = useFormSubmit('auth/forgot-password', (res, values) => {
        if (res.status === 1) {
            localStorage.setItem('email', values.email); // Save for reset password usage
            navigate('/reset-password');
        }
    });

    const formik = useFormik({
        initialValues: {
            email: ''
        },
        validationSchema: forgotPasswordSchema,
        onSubmit: handleSubmit
    });

    return (
        <>
            <Header />
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                {loading && <Loader />}
                <form onSubmit={formik.handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
                    <h2 className="text-2xl mb-4 font-bold">Forgot Password</h2>

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

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Send OTP</button>
                </form>
            </div>
        </>
    )
}

export default ForgotPassword;