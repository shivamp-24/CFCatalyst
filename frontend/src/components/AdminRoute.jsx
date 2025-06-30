import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const AdminRoute = () => {
  const { user } = useAuth();

  // Add console logs to debug
  console.log("Current user:", user);
  console.log("User role:", user?.role);
  console.log("Is admin check:", user?.role === "admin");

  // Check if user is logged in and is an admin
  if (!user || user.role !== "admin") {
    console.log("Access denied: Redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Access granted: User is admin");
  return <Outlet />;
};

export default AdminRoute;
