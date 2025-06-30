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
        .get("/api/auth/user")
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          // Token is invalid
          logout();
        });
    }
  }, [token]);

  const login = async (email, password, codeforcesHandle) => {
    try {
      const payload = {};
      if (email) payload.email = email;
      if (codeforcesHandle) payload.codeforcesHandle = codeforcesHandle;
      payload.password = password;

      const response = await apiService.post("/api/auth/login", payload);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const register = async (userData) => {
    try {
      await apiService.post("/api/auth/register", userData);

      // Redirect to login after successful registration
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
    }
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
