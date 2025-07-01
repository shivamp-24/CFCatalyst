// the "brain" of your frontend's authentication. It will hold the user's token and data,
// and provide login/logout functions to the entire app.

import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../api/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [serverStatus, setServerStatus] = useState("unknown"); // "unknown", "online", "offline"
  const navigate = useNavigate();

  // Check if the server is available
  const checkServerAvailability = async () => {
    try {
      // Use a shorter timeout for this health check
      const response = await apiService.get("/api/auth/health", {
        timeout: 5000,
      });
      setServerStatus("online");
      return true;
    } catch (error) {
      console.error("Server health check failed:", error);
      setServerStatus("offline");
      return false;
    }
  };

  useEffect(() => {
    // Check server availability on component mount
    checkServerAvailability();

    // Set up interval to periodically check server availability
    const intervalId = setInterval(() => {
      if (serverStatus !== "online") {
        checkServerAvailability();
      }
    }, 30000); // Check every 30 seconds if offline

    return () => clearInterval(intervalId);
  }, [serverStatus]);

  useEffect(() => {
    if (token) {
      apiService.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user data if token exists and server is not known to be offline
      if (serverStatus !== "offline") {
        apiService
          .get("/api/auth/user")
          .then((response) => {
            setUser(response.data);
          })
          .catch((error) => {
            console.error("Failed to fetch user:", error);
            // If the error is a 401 Unauthorized, token is invalid
            if (error.response?.status === 401) {
              logout();
            }
          });
      }
    }
  }, [token, serverStatus]);

  const login = async (email, password, codeforcesHandle) => {
    try {
      // First check if server is available
      const isServerAvailable = await checkServerAvailability();
      if (!isServerAvailable) {
        throw new Error(
          "Server is currently unavailable. Please try again later."
        );
      }

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
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      // Throw the error with a formatted message to be handled by the login component
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // First check if server is available
      const isServerAvailable = await checkServerAvailability();
      if (!isServerAvailable) {
        throw new Error(
          "Server is currently unavailable. Please try again later."
        );
      }

      await apiService.post("/api/auth/register", userData);

      // Redirect to login after successful registration
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        serverStatus,
        checkServerAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
