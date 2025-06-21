// the "brain" of your frontend's authentication. It will hold the user's token and data,
// and provide login/logout functions to the entire app.

import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../api/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      apiService.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user data if token exists
      apiService
        .get("/auth/user")
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          // Token is invalid
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await apiService.post("/auth/login", { email, password });
    const { token } = response.data;
    localStorage.setItem("token", token);
    setToken(token);
    navigate("/dashboard");
  };

  const register = async (userData) => {
    await apiService.post("/auth/register", userData);

    // Redirect to login after successful registration
    navigate("/login");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
