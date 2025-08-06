import React, {createContext, useContext, useState} from "react";
import { loginApi, signupApi, verifyOtpApi } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children}) => {
    const [auth, setAuth] = useState({});
    const [loading, setLoading] = useState(false);

    const signup = async data => {
        setLoading(true);
        const res = await signupApi(data);
        setLoading(false);
        return res
    }

    const verifyOtp = async data => {
        setLoading(true);
        const res = await verifyOtpApi(data);
        setLoading(false);
        if(res.status === 1) setAuth({email: data.email, token: res.token});
        return res;
    }

    const login = async data => {
        setLoading(true);
        const res = await loginApi(data);
        setLoading(false);
        if(res.status === 1) setAuth({email: data.email, token: res.token});
        return res;
    }

    return(
        <AuthContext.Provider value={{ auth, loading, signup, verifyOtp, login}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);