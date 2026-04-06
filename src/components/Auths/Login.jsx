// src/components/LoginModal.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  FaTimes,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
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
          secure: import.meta.env.PROD,
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
      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label} {required && "*"}
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            {React.createElement(Icon, {
              className: hasError ? "text-red-500" : "text-slate-400",
            })}
          </div>

          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            onBlur={handleBlur}
            autoComplete={autoComplete}
            className={`w-full rounded-md border px-4 py-3.5 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:outline-none focus:ring-2 ${
              hasError
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                : showSuccess
                  ? "border-emerald-300 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-100"
                  : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-blue-100"
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
              className="absolute inset-y-0 right-0 flex items-center pr-4"
            >
              {showPassword ? (
                <FaEyeSlash className="text-slate-400 hover:text-slate-600" />
              ) : (
                <FaEye className="text-slate-400 hover:text-slate-600" />
              )}
            </button>
          )}
        </div>

        {hasError && (
          <div className="mt-2 flex items-center text-xs text-red-600">
            <FaExclamationCircle className="mr-1" />
            {errors[name]}
          </div>
        )}

        {showSuccess && !hasError && (
          <div className="mt-2 flex items-center text-xs text-emerald-600">
            <FaCheckCircle className="mr-1" />
            Looks good!
          </div>
        )}
      </div>
    );
  };

  if (!asPage && !isOpen) return null;

  const content = (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-6 md:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900"
          >
            <FaArrowLeft className="h-3.5 w-3.5" />
            <span>Back to home</span>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
            Hooks Access
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in to continue comparing phones, laptops, TVs, and more.
          </p>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8">
        {/* API Error Message */}
        {apiError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <FaExclamationCircle className="text-red-600" />
              <p className="text-sm font-medium text-red-700">{apiError}</p>
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
            placeholder: "you@example.com",
            autoComplete: "email",
          })}

          {renderInput({
            name: "password",
            label: "Password",
            type: showPassword ? "text" : "password",
            icon: FaLock,
            placeholder: "********",
            autoComplete: "current-password",
          })}

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <FaSpinner className="mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <FaArrowRight className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                if (typeof onSwitchToSignup === "function") onSwitchToSignup();
                else navigate("/signup");
              }}
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Sign up now
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  if (asPage) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
        <div className="mx-auto flex w-full max-w-xl items-center justify-center">
          <div className="w-full">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative mx-auto w-full max-w-xl">{content}</div>
      </div>
    </div>
  );
};

export default Login;
