import { createContext, useState, useEffect } from "react";
import { api } from "../config/api";
import toast from "react-hot-toast";

export const AuthContext = createContext();

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
      const res = await api.post("/auth/login", payload);

      if (res.data.success) {
        const nextUser = {
          ...res.data.user,
          token: res.data.token,
        };
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);

        return { success: true, message: res.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login Failed";
      return { success: false, message: errorMessage };
    }
  };

  // 🔹 Logout Function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    toast.success("Logged Out");
  };

  // 🔹 Attach token automatically
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
