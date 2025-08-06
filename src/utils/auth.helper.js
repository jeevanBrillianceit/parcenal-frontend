import { jwtDecode } from "jwt-decode";

export const isTokenValid = () => {
  const userData = localStorage.getItem('user');
  if (!userData) return false;

  try {
    const user = JSON.parse(userData);
    const decoded = jwtDecode(user.token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      localStorage.removeItem('user');
      return false;
    }
    return true;
  } catch (err) {
    localStorage.removeItem('user');
    return false;
  }
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('user');
};
