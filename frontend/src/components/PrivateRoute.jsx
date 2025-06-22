// This component will guard routes that require a user to be logged in.

import useAuth from "../hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const { token } = useAuth();

  // If a token exists, render the child components (Outlet). Otherwise, redirect to home page.
  return token ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
