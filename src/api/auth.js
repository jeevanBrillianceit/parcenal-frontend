import api from "../utils/apis";

export const signupApi = data => api.post('/auth/signup', data).then(r => r.data);
export const verifyOtpApi = data => api.post('/auth/verify-otp', data).then(r => r.data);
export const loginApi = data => api.post('/auth/login', data).then(r => r.data);