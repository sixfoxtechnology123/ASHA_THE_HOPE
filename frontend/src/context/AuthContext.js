import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import toast from "react-hot-toast";

export const AuthContext = createContext();

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load user from localStorage on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

const login = async (payload) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, payload);
    
    if (res.data.success) {
      // Save token and user info
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      
      // Return the success message from the backend
      return { success: true, message: res.data.message };
    }
  } catch (error) {
    // This looks into the error response from your backend
    // It will find "Invalid User ID" or "Invalid Password" here
    const errorMessage = error.response?.data?.message || "Login Failed";
    
    return { success: false, message: errorMessage };
  }
};

  // 🔹 Logout Function
  const logout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
    toast.success("Logged Out");
  };

  // 🔹 Attach token automatically
  useEffect(() => {
    API.interceptors.request.use((config) => {
      const storedUser =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(sessionStorage.getItem("user"));

      if (storedUser?.token) {
        config.headers.Authorization = `Bearer ${storedUser.token}`;
      }

      return config;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
