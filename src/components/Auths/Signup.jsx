// src/components/Signup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  FaMapMarkerAlt,
  FaGlobe,
  FaBuilding,
  FaMapPin,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
// store logos now fetched via `useStoreLogos` where needed
import Cookies from "js-cookie";

// Stable Wrapper component moved to top-level to avoid remounting children
const Wrapper = ({ children, asPage, onClose }) =>
  asPage ? (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      {/* Header Back Button */}

      <div className="flex items-center justify-center p-4 md:p-6">
        <div className="relative w-full max-w-2xl mx-auto mt-8">{children}</div>
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative w-full max-w-2xl mx-auto">{children}</div>
      </div>
    </div>
  );

const Signup = ({
  isOpen,
  onClose,
  onSignupSuccess,
  onSwitchToLogin,
  asPage = false,
}) => {
  // Form states
  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    country: "",
    state: "",
    zip_code: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const navigate = useNavigate();

  // Validation rules
  const validationRules = {
    f_name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s]+$/,
      message: "First name must be 2-50 letters only",
    },
    l_name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s]+$/,
      message: "Last name must be 2-50 letters only",
    },
    username: {
      required: true,
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_]+$/,
      message: "Username: 3-30 chars, letters, numbers, underscores only",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    password: {
      required: true,
      minLength: 8,
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: "Min 8 chars with uppercase, lowercase, number & special char",
    },
    confirmPassword: {
      required: true,
      match: "password",
      message: "Passwords must match",
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

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message;
    }

    if (name === "confirmPassword" && value !== formData.password) {
      return "Passwords do not match";
    }

    return "";
  };

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value, selectionStart, selectionEnd } = e.target;

    // Update form data
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

    // Preserve caret position & refocus in case the input briefly loses focus
    // (helps when parent/component re-renders replace the input DOM)
    requestAnimationFrame(() => {
      try {
        const inputs = document.getElementsByName(name);
        if (inputs && inputs.length) {
          const input = inputs[0];
          input.focus();
          if (
            typeof selectionStart === "number" &&
            typeof selectionEnd === "number"
          ) {
            input.setSelectionRange(selectionStart, selectionEnd);
          }
        }
      } catch (err) {
        // ignore
      }
    });
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

  // Check username availability with debounce
  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      if (errors.username) return;

      const debounceTimer = setTimeout(async () => {
        setCheckingAvailability(true);
        try {
          const response = await fetch(
            `https://api.apisphere.in/api/auth/check-username?username=${encodeURIComponent(
              formData.username,
            )}`,
          );
          const data = await response.json();
          setUsernameAvailable(data.available);
        } catch (err) {
          console.error("Error checking username:", err);
          setUsernameAvailable(null);
        } finally {
          setCheckingAvailability(false);
        }
      }, 500);

      return () => clearTimeout(debounceTimer);
    };

    checkUsername();
  }, [formData.username, errors.username]);

  // Check email availability with debounce
  useEffect(() => {
    const checkEmail = async () => {
      if (
        !formData.email ||
        !validationRules.email.pattern.test(formData.email)
      ) {
        setEmailAvailable(null);
        return;
      }

      if (errors.email) return;

      const debounceTimer = setTimeout(async () => {
        setCheckingAvailability(true);
        try {
          const response = await fetch(
            `https://api.apisphere.in/api/auth/check-email?email=${encodeURIComponent(
              formData.email,
            )}`,
          );
          const data = await response.json();
          setEmailAvailable(data.available);
        } catch (err) {
          console.error("Error checking email:", err);
          setEmailAvailable(null);
        } finally {
          setCheckingAvailability(false);
        }
      }, 500);

      return () => clearTimeout(debounceTimer);
    };

    checkEmail();
  }, [formData.email, errors.email]);

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password)
      return { score: 0, color: "bg-gray-200", text: "Weak", width: "0%" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];
    const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const widths = ["20%", "40%", "60%", "80%", "100%"];

    return {
      score: Math.min(score, 5),
      color: colors[Math.min(score, 5) - 1] || "bg-gray-200",
      text: texts[Math.min(score, 5) - 1] || "Weak",
      width: widths[Math.min(score, 5) - 1] || "0%",
    };
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Check required fields
    Object.keys(validationRules).forEach((field) => {
      const rules = validationRules[field];
      const value =
        field === "confirmPassword"
          ? formData.confirmPassword
          : formData[field];

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

    // Check username availability
    if (usernameAvailable === false) {
      newErrors.username = "Username already taken";
      isValid = false;
    }

    // Check email availability
    if (emailAvailable === false) {
      newErrors.email = "Email already registered";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Form submission
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

    // Check availability again
    if (usernameAvailable === false || emailAvailable === false) {
      setApiError(
        "Username or email is already taken. Please choose different ones.",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API call
      const userData = {
        f_name: formData.f_name.trim(),
        l_name: formData.l_name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        terms_accepted: true,
        newsletter_optin: false,
      };

      // API call - Use your actual endpoint
      const response = await fetch(
        "https://api.apisphere.in/api/auth/customer/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Success
      if (typeof onSignupSuccess === "function") {
        onSignupSuccess(data.token, data.user);
      } else {
        // Store auth data in cookies
        Cookies.set("arenak", data.token, {
          expires: 7,
          sameSite: "strict",
        });

        Cookies.set("user_data", JSON.stringify(data.user), {
          expires: 7,
          sameSite: "strict",
        });

        // Redirect based on whether email verification is needed
        if (data.requires_verification) {
          navigate("/verify-email", {
            state: { email: formData.email },
          });
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength
  const passwordStrength = getPasswordStrength(formData.password);

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
    showAvailability = false,
    availability = null,
  }) => {
    const hasError = getFieldError(name);
    const showSuccess = !hasError && formData[name] && touched[name];

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && "*"}
          </label>
          {showAvailability && availability !== null && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                availability
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {availability ? "Available" : "Taken"}
            </span>
          )}
        </div>

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

          {showSuccess && !showAvailability && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaCheckCircle className="text-green-500" />
            </div>
          )}

          {showAvailability && checkingAvailability && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSpinner className="text-blue-500 animate-spin" />
            </div>
          )}

          {/* Password visibility toggle */}
          {(name === "password" || name === "confirmPassword") && (
            <button
              type="button"
              onClick={() =>
                name === "password"
                  ? setShowPassword(!showPassword)
                  : setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {name === "password" ? (
                showPassword ? (
                  <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="text-gray-400 hover:text-gray-600" />
                )
              ) : showConfirmPassword ? (
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

        {showSuccess && !showAvailability && !hasError && (
          <div className="mt-1 flex items-center text-green-600 text-xs">
            <FaCheckCircle className="mr-1" />
            Looks good!
          </div>
        )}
      </div>
    );
  };

  if (!asPage && !isOpen) return null;

  return (
    <Wrapper asPage={asPage} onClose={onClose}>
      <div className="relative bg-white  overflow-hidden shadow-xl">
        {/* Header */}
        <div className=" border-b border-gray-100 px-6 md:px-8 py-6">
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
            <h3 className="text-2xl font-bold text-gray-900">
              Join SmartArena
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your account to explore devices
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 py-6">
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
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput({
                name: "f_name",
                label: "First Name",
                icon: FaUser,
                placeholder: "What should we call you?",
                autoComplete: "given-name",
              })}

              {renderInput({
                name: "l_name",
                label: "Last Name",
                icon: FaUser,
                placeholder: "Your legendary last name",
                autoComplete: "family-name",
              })}
            </div>

            {/* Username */}
            {renderInput({
              name: "username",
              label: "Username",
              icon: FaUser,
              placeholder: "This will be your identity",
              autoComplete: "username",
              showAvailability: true,
              availability: usernameAvailable,
            })}

            {/* Email */}
            {renderInput({
              name: "email",
              label: "Email Address",
              type: "email",
              icon: FaEnvelope,
              placeholder: "Where should we email you?",
              autoComplete: "email",
              showAvailability: true,
              availability: emailAvailable,
            })}

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {renderInput({
                  name: "password",
                  label: "Password",
                  type: showPassword ? "text" : "password",
                  icon: FaLock,
                  placeholder: "Create a strong password ",
                  autoComplete: "new-password",
                })}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        Password strength:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength.score >= 4
                            ? "text-green-600"
                            : passwordStrength.score >= 3
                              ? "text-blue-600"
                              : passwordStrength.score >= 2
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${passwordStrength.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: passwordStrength.width }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <FaInfoCircle className="inline mr-1" />
                      Must include uppercase, lowercase, number & special
                      character
                    </div>
                  </div>
                )}
              </div>

              <div>
                {renderInput({
                  name: "confirmPassword",
                  label: "Confirm Password",
                  type: showConfirmPassword ? "text" : "password",
                  icon: FaLock,
                  placeholder: "Re-enter your password",
                  autoComplete: "new-password",
                })}

                {/* Password Match Indicator */}
                {formData.password && formData.confirmPassword && (
                  <div
                    className={`mt-2 text-xs flex items-center ${
                      formData.password === formData.confirmPassword
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <FaCheckCircle className="mr-1" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <FaExclamationCircle className="mr-1" />
                        Passwords do not match
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                Location Information (Optional)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput({
                  name: "city",
                  label: "City",
                  icon: FaBuilding,
                  placeholder: "Where do you live?",
                  autoComplete: "address-level2",
                  required: false,
                })}

                {renderInput({
                  name: "country",
                  label: "Country",
                  icon: FaGlobe,
                  placeholder: "Your country",
                  autoComplete: "country-name",
                  required: false,
                })}

                {renderInput({
                  name: "state",
                  label: "State/Province",
                  icon: FaMapMarkerAlt,
                  placeholder: "State you belong to",
                  autoComplete: "address-level1",
                  required: false,
                })}

                {renderInput({
                  name: "zip_code",
                  label: "ZIP/Postal Code",
                  icon: FaMapPin,
                  placeholder: "PIN / ZIP code",
                  autoComplete: "postal-code",
                  required: false,
                })}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start mt-4 p-3 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  Privacy Policy
                </a>
                . I understand that SmartArena will collect and process my data
                as described in these documents.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  if (typeof onSwitchToLogin === "function") {
                    onSwitchToLogin();
                  } else {
                    navigate("/login");
                  }
                }}
                className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Bottom Gradient Border */}
        <div className="h-1 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600"></div>
      </div>
    </Wrapper>
  );
};

export default Signup;


