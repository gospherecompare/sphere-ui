// src/components/LoginModal.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  FaTimes,
  FaEnvelope,
  FaLock,
  FaUser,
  FaGoogle,
  FaFacebookF,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaArrowLeft,
} from "react-icons/fa";
// store logos now fetched via `useStoreLogos` where needed

const Login = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
  asPage = false,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  // Initialize form from cookies if available
  useEffect(() => {
    const savedEmail = Cookies.get("remembered_email");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Validation rules
  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    password: {
      required: true,
      minLength: 6,
      message: "Password must be at least 6 characters",
    },
  };

  // Real-time validation
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return "";

    if (rules.required && !value.trim()) {
      return "This field is required";
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message;
    }

    return "";
  };

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }

    // Clear any previous error for this field
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");

    // Validate immediately
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Handle blur for more aggressive validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const rules = validationRules[field];
      const value = formData[field];

      if (rules.required && !value.trim()) {
        newErrors[field] = "This field is required";
        isValid = false;
      } else {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validate form
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allTouched = {};
      Object.keys(validationRules).forEach((field) => {
        allTouched[field] = true;
      });
      setTouched(allTouched);
      return;
    }

    setIsLoading(true);

    try {
      // API call to your actual login endpoint
      const response = await fetch(
        "https://api.apisphere.in/api/auth/customer/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            rememberMe,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Success - Set cookies with js-cookie
      const tokenExpiry = rememberMe ? 7 : 1; // 7 days if remember me, 1 day otherwise

      // Set auth token
      Cookies.set("arenak", data.token, {
        expires: tokenExpiry,
        sameSite: "strict",
      });

      // Set complete user data as JSON
      Cookies.set("user_data", JSON.stringify(data.user), {
        expires: tokenExpiry,
        sameSite: "strict",
      });

      // Store email in cookies if remember me is checked
      if (rememberMe) {
        Cookies.set("remembered_email", formData.email.trim().toLowerCase(), {
          expires: 30, // Store for 30 days
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      } else {
        // Remove remembered email if not checked
        Cookies.remove("remembered_email");
      }

      // Call success callback if provided
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(data.token, data.user);
      } else {
        // Redirect to home or intended page
        const redirectTo = Cookies.get("redirectAfterLogin") || "/";
        Cookies.remove("redirectAfterLogin");
        navigate(redirectTo);
      }
    } catch (err) {
      setApiError(
        err.message || "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // Get field error state
  const getFieldError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  // Render input with error handling
  const renderInput = ({
    name,
    label,
    type = "text",
    icon: Icon,
    placeholder,
    autoComplete,
    required = true,
  }) => {
    const hasError = getFieldError(name);
    const showSuccess = !hasError && formData[name] && touched[name];

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && "*"}
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon
              className={`${hasError ? "text-red-400" : "text-gray-400"}`}
            />
          </div>

          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            onBlur={handleBlur}
            autoComplete={autoComplete}
            className={`pl-10 pr-10 w-full px-4 py-3 border rounded-full transition-all duration-200 focus:ring-2 focus:outline-none ${
              hasError
                ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                : showSuccess
                  ? "border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500"
                  : "border-gray-200 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            }`}
            placeholder={placeholder}
            required={required}
          />

          {showSuccess && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaCheckCircle className="text-green-500" />
            </div>
          )}

          {/* Password visibility toggle */}
          {name === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
              ) : (
                <FaEye className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
        </div>

        {hasError && (
          <div className="mt-1 flex items-center text-red-600 text-xs">
            <FaExclamationCircle className="mr-1" />
            {errors[name]}
          </div>
        )}

        {showSuccess && !hasError && (
          <div className="mt-1 flex items-center text-green-600 text-xs">
            <FaCheckCircle className="mr-1" />
            Looks good!
          </div>
        )}
      </div>
    );
  };

  if (!asPage && !isOpen) return null;

  const content = (
    <div className="relative bg-white  overflow-hidden shadow-xl">
      {/* Header with gradient */}
      <div className=" border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue to SmartArena
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Social Login (Optional) */}
        {false && (
          <>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSocialLogin("google")}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
              >
                <FaGoogle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Continue with Google
                </span>
              </button>
              <button
                onClick={() => handleSocialLogin("facebook")}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
              >
                <FaFacebookF className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Continue with Facebook
                </span>
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or sign in with email
                </span>
              </div>
            </div>
          </>
        )}

        {/* API Error Message */}
        {apiError && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 border border-red-100 rounded-xl">
            <div className="flex items-center">
              <FaExclamationCircle className="text-red-500 mr-3" />
              <p className="text-sm text-red-600 font-medium">{apiError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderInput({
            name: "email",
            label: "Email Address",
            type: "email",
            icon: FaEnvelope,
            placeholder: "your.email@example.com",
            autoComplete: "email",
          })}

          {renderInput({
            name: "password",
            label: "Password",
            type: showPassword ? "text" : "password",
            icon: FaLock,
            placeholder: "••••••••",
            autoComplete: "current-password",
          })}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <FaArrowRight className="ml-2" />
              </>
            )}
          </button>

          {/* Demo credentials info (for development only) */}
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                if (typeof onSwitchToSignup === "function") onSwitchToSignup();
                else navigate("/signup");
              }}
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign up now
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Gradient Border */}
      <div className="h-1 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600"></div>
    </div>
  );

  if (asPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
        {/* Header Back Button */}

        <div className="flex items-center justify-center p-4 md:p-6">
          <div className="relative w-full max-w-md mx-auto mt-8">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-md mx-auto">{content}</div>
      </div>
    </div>
  );
};

export default Login;


