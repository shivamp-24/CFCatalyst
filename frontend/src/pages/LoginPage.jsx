import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  LoaderCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    identifier: false,
    password: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, serverStatus, checkServerAvailability } = useAuth();

  const validate = (name, value) => {
    switch (name) {
      case "identifier":
        if (!value.trim()) {
          return "Email or Codeforces handle is required";
        }
        return "";
      case "password":
        if (!value) {
          return "Password is required";
        }
        if (value.length < 6) {
          return "Password must be at least 6 characters";
        }
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const identifierError = validate("identifier", formData.identifier);
    const passwordError = validate("password", formData.password);

    setErrors({
      identifier: identifierError,
      password: passwordError,
    });

    setTouched({
      identifier: true,
      password: true,
    });

    // If there are errors, don't submit
    if (identifierError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      // Determine if identifier is email or handle
      const isEmail = formData.identifier.includes("@");

      // Call the login function with either email or handle
      if (isEmail) {
        await login(formData.identifier, formData.password);
      } else {
        await login(null, formData.password, formData.identifier);
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Navigation is handled by the login function in AuthContext
      // Add an extra navigation call to ensure redirect happens
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      // Extract error message from response if available
      let errorMessage = "Failed to log in. Please check your credentials.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === "ECONNABORTED") {
        errorMessage =
          "Server request timed out. The backend may be unavailable or starting up. Please try again in a few minutes.";
      } else if (!error.response) {
        errorMessage =
          "Cannot connect to server. Please check your internet connection and try again.";
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });

      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing if field was previously touched
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClasses =
      "border-gray-200 focus:border-gray-300 focus:ring-gray-200";
    if (!touched[fieldName]) return baseClasses;
    return errors[fieldName]
      ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50"
      : "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center text-center mb-8">
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:bg-gray-100 group-hover:shadow-md">
              <Trophy className="h-8 w-8 text-gray-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-700" />
            </div>
            <span className="text-2xl font-bold text-gray-900 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gray-600 after:transition-all after:duration-300 group-hover:after:w-full">
              CFCatalyst
            </span>
          </Link>
        </div>

        <Card className="border-gray-100 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Log in to continue your Codeforces journey
            </CardDescription>

            {/* Server Status Indicator */}
            <div className="flex justify-center items-center mt-2">
              {serverStatus === "online" ? (
                <div className="text-green-600 text-sm flex items-center">
                  <Wifi className="h-4 w-4 mr-1" />
                  Server Online
                </div>
              ) : serverStatus === "offline" ? (
                <div className="text-red-600 text-sm flex items-center">
                  <WifiOff className="h-4 w-4 mr-1" />
                  Server Offline
                  <button
                    className="ml-2 text-blue-600 underline text-xs"
                    onClick={checkServerAvailability}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="text-yellow-600 text-sm flex items-center">
                  <LoaderCircle className="h-4 w-4 mr-1 animate-spin" />
                  Checking Server...
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label
                  htmlFor="identifier"
                  className={`text-gray-700 flex justify-between ${
                    errors.identifier && touched.identifier
                      ? "text-red-500"
                      : ""
                  }`}
                >
                  <span>Email or Codeforces Handle</span>
                  {touched.identifier && !errors.identifier && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="Enter email or CF handle"
                    value={formData.identifier}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClassName("identifier")}
                    aria-invalid={errors.identifier ? "true" : "false"}
                    required
                  />
                </div>
                {errors.identifier && touched.identifier && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.identifier}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className={`text-gray-700 flex items-center gap-2 ${
                      errors.password && touched.password ? "text-red-500" : ""
                    }`}
                  >
                    <span>Password</span>
                    {touched.password && !errors.password && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                  required
                />
                {errors.password && touched.password && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
