import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Helmet } from "react-helmet-async";
import {
  FaUser,
  FaHeart,
  FaLock,
  FaTimes,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
  FaBuilding,
  FaMapPin,
  FaPhone,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import Wishlist from "./Wishlist";

const AccountManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    f_name: "",
    l_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
  });

  const [accountErrors, setAccountErrors] = useState({});
  const [accountTouched, setAccountTouched] = useState({});

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = Cookies.get("arenak");
      console.log("Token from cookie:", token ? "exists" : "missing");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "https://api.apisphere.in/api/auth/user-profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Profile response status:", response.status);
      if (response.status === 403) {
        console.warn(
          "Token validation failed (403). This might be an old token. Please login again.",
        );
        Cookies.remove("arenak");
        Cookies.remove("user_data");
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setAccountForm({
          f_name: data.user.f_name || "",
          l_name: data.user.l_name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          city: data.user.city || "",
          state: data.user.state || "",
          country: data.user.country || "",
          zip_code: data.user.zip_code || "",
        });
      } else if (response.status === 401) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setMessage({ type: "error", text: "Failed to load profile" });
    }
  };

  // Validation for account form
  const validateAccountField = (name, value) => {
    if (name === "f_name" || name === "l_name") {
      if (!value.trim()) return "This field is required";
      if (!/^[A-Za-z\s]+$/.test(value)) return "Only letters allowed";
      if (value.length < 2) return "Minimum 2 characters required";
      if (value.length > 50) return "Maximum 50 characters allowed";
    }

    if (name === "email") {
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email address";
    }

    if (name === "phone") {
      if (value && !/^[\d\s\-\+]+$/.test(value)) return "Invalid phone number";
    }

    if (name === "city" || name === "state" || name === "country") {
      if (value && !/^[A-Za-z\s\-]+$/.test(value))
        return "Only letters and spaces allowed";
    }

    if (name === "zip_code") {
      if (value && !/^[A-Za-z0-9\s\-]+$/.test(value))
        return "Invalid zip code format";
    }

    return "";
  };

  // Validation for password form
  const validatePasswordField = (name, value) => {
    if (name === "currentPassword") {
      if (!value) return "Current password is required";
    }

    if (name === "newPassword") {
      if (!value) return "New password is required";
      if (value.length < 8) return "Minimum 8 characters required";
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
        return "Must have uppercase, lowercase, number & special character";
      }
    }

    if (name === "confirmPassword") {
      if (!value) return "Please confirm password";
      if (value !== passwordForm.newPassword) return "Passwords do not match";
    }

    return "";
  };

  // Handle account form change
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm({ ...accountForm, [name]: value });
    setAccountTouched({ ...accountTouched, [name]: true });

    const error = validateAccountField(name, value);
    setAccountErrors({ ...accountErrors, [name]: error });
  };

  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    setPasswordTouched({ ...passwordTouched, [name]: true });

    const error = validatePasswordField(name, value);
    setPasswordErrors({ ...passwordErrors, [name]: error });
  };

  // Update account
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate all fields
    const newErrors = {};
    Object.keys(accountForm).forEach((key) => {
      const error = validateAccountField(key, accountForm[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setAccountErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const token = Cookies.get("arenak");
      const response = await fetch(
        "https://api.apisphere.in/api/auth/update-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(accountForm),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setUserData(data.user);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update profile",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate all fields
    const newErrors = {};
    Object.keys(passwordForm).forEach((key) => {
      const error = validatePasswordField(key, passwordForm[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setIsLoading(true);

    try {
      const token = Cookies.get("arenak");
      const response = await fetch(
        "https://api.apisphere.in/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
        setPasswordTouched({});
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to change password",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("arenak");
    navigate("/login");
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Account - SmartArena</title>
        <meta name="description" content="Manage your SmartArena account" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
          >
            <FaArrowLeft /> Back to Home
          </button>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                  <FaUser />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userData.f_name} {userData.l_name}
                  </h1>
                  <p className="text-gray-600">{userData.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("account")}
                className={`flex-1 py-4 px-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "account"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaUser /> Manage Account
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-4 px-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "password"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaLock /> Change Password
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-4 px-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "favorites"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaHeart /> Favorites
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Message Alert */}
              {message.text && (
                <div
                  className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
                    message.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <FaCheckCircle />
                  ) : (
                    <FaExclamationCircle />
                  )}
                  {message.text}
                </div>
              )}

              {/* Manage Account Tab */}
              {activeTab === "account" && (
                <form onSubmit={handleUpdateAccount} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="f_name"
                        value={accountForm.f_name}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({ ...accountTouched, f_name: true })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.f_name && accountErrors.f_name
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="John"
                      />
                      {accountTouched.f_name && accountErrors.f_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.f_name}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="l_name"
                        value={accountForm.l_name}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({ ...accountTouched, l_name: true })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.l_name && accountErrors.l_name
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Doe"
                      />
                      {accountTouched.l_name && accountErrors.l_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.l_name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaEnvelope /> Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={accountForm.email}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({ ...accountTouched, email: true })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.email && accountErrors.email
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="john@example.com"
                      />
                      {accountTouched.email && accountErrors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaPhone /> Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={accountForm.phone}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({ ...accountTouched, phone: true })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.phone && accountErrors.phone
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="+1234567890"
                      />
                      {accountTouched.phone && accountErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaBuilding /> City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={accountForm.city}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({ ...accountTouched, city: true })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.city && accountErrors.city
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="New York"
                      />
                      {accountTouched.city && accountErrors.city && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.city}
                        </p>
                      )}
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaMapMarkerAlt /> State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={accountForm.state}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({ ...accountTouched, state: true })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.state && accountErrors.state
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="NY"
                      />
                      {accountTouched.state && accountErrors.state && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.state}
                        </p>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaGlobe /> Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={accountForm.country}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({
                            ...accountTouched,
                            country: true,
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.country && accountErrors.country
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="United States"
                      />
                      {accountTouched.country && accountErrors.country && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.country}
                        </p>
                      )}
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaMapPin /> Zip Code
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={accountForm.zip_code}
                        onChange={handleAccountChange}
                        onBlur={() =>
                          setAccountTouched({
                            ...accountTouched,
                            zip_code: true,
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          accountTouched.zip_code && accountErrors.zip_code
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="10001"
                      />
                      {accountTouched.zip_code && accountErrors.zip_code && (
                        <p className="text-red-500 text-sm mt-1">
                          {accountErrors.zip_code}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Updating...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </form>
              )}

              {/* Change Password Tab */}
              {activeTab === "password" && (
                <form
                  onSubmit={handleUpdatePassword}
                  className="max-w-md space-y-6"
                >
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        onBlur={() =>
                          setPasswordTouched({
                            ...passwordTouched,
                            currentPassword: true,
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 transition-all ${
                          passwordTouched.currentPassword &&
                          passwordErrors.currentPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-3 text-gray-600"
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordTouched.currentPassword &&
                      passwordErrors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        onBlur={() =>
                          setPasswordTouched({
                            ...passwordTouched,
                            newPassword: true,
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 transition-all ${
                          passwordTouched.newPassword &&
                          passwordErrors.newPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-gray-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordTouched.newPassword &&
                      passwordErrors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    <p className="text-xs text-gray-500 mt-2">
                      Min 8 characters with uppercase, lowercase, number &
                      special character
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        onBlur={() =>
                          setPasswordTouched({
                            ...passwordTouched,
                            confirmPassword: true,
                          })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 transition-all ${
                          passwordTouched.confirmPassword &&
                          passwordErrors.confirmPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-3 text-gray-600"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordTouched.confirmPassword &&
                      passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Updating...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </form>
              )}

              {/* Favorites Tab */}
              {activeTab === "favorites" && <Wishlist />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountManagement;


