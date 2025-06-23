import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Trophy, AlertCircle } from "lucide-react";
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
import apiService from "@/api/apiService";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    handle: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    handle: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    handle: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const validate = (name, value) => {
    switch (name) {
      case "handle":
        if (!value.trim()) {
          return "Codeforces handle is required";
        }
        // Codeforces handle validation - alphanumeric and underscore only
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return "Handle can only contain letters, numbers, and underscores";
        }
        return "";
      case "email":
        if (!value.trim()) {
          return "Email is required";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
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
      case "confirmPassword":
        if (!value) {
          return "Please confirm your password";
        }
        if (value !== formData.password) {
          return "Passwords do not match";
        }
        return "";
      default:
        return "";
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const handleError = validate("handle", formData.handle);
    const emailError = validate("email", formData.email);
    const passwordError = validate("password", formData.password);
    const confirmPasswordError = validate(
      "confirmPassword",
      formData.confirmPassword
    );

    setErrors({
      handle: handleError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    setTouched({
      handle: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // If there are errors, don't submit
    if (handleError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setIsLoading(true);

    try {
      // Map form data to backend API format
      const userData = {
        codeforcesHandle: formData.handle,
        email: formData.email,
        password: formData.password,
      };

      // Call the register function from AuthContext
      await register(userData);

      toast({
        title: "Success",
        description: "Account created successfully!",
      });

      // Navigate is handled by the register function in AuthContext
    } catch (error) {
      console.error("Registration error:", error);

      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create account. Please try again.";

      toast({
        title: "Registration Failed",
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

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));

      // If confirm password is already touched, validate it again
      if (touched.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validate(
            "confirmPassword",
            formData.confirmPassword
          ),
        }));
      }
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
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
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Start your Codeforces journey with personalized practice contests
              and targeted skill improvement.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label
                  htmlFor="handle"
                  className={`text-gray-700 flex justify-between ${
                    errors.handle && touched.handle ? "text-red-500" : ""
                  }`}
                >
                  <span>Codeforces Handle</span>
                  {touched.handle && !errors.handle && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="handle"
                    name="handle"
                    type="text"
                    placeholder="Enter CF Handle"
                    value={formData.handle}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClassName("handle")}
                    aria-invalid={errors.handle ? "true" : "false"}
                    required
                  />
                </div>
                {errors.handle && touched.handle && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.handle}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={`text-gray-700 flex justify-between ${
                    errors.email && touched.email ? "text-red-500" : ""
                  }`}
                >
                  <span>Email</span>
                  {touched.email && !errors.email && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  required
                />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className={`text-gray-700 flex justify-between ${
                    errors.password && touched.password ? "text-red-500" : ""
                  }`}
                >
                  <span>Password</span>
                  {touched.password && !errors.password && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                  required
                />
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                  </div>
                )}
                {errors.password && touched.password && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className={`text-gray-700 flex justify-between ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "text-red-500"
                      : ""
                  }`}
                >
                  <span>Confirm Password</span>
                  {touched.confirmPassword && !errors.confirmPassword && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClassName("confirmPassword")}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    required
                  />
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Click to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
