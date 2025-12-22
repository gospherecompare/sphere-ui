// src/components/Footer.jsx
import React, { useState } from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaGithub,
  FaNewspaper,
  FaBullhorn,
  FaShoppingCart,
  FaAd,
  FaGlobe,
  FaHeart,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaRocket,
  FaMobileAlt,
  FaChevronRight,
  FaShieldAlt,
  FaStar,
  FaGem,
} from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with: ${email}`);
      setEmail("");
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Top Section - Brand & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaMobileAlt className="text-white text-lg" />
                </div>
                <h2 className="text-2xl font-heading font-bold">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Smart Arena
                  </span>
                </h2>
              </div>
              <h6 className="text-white-800 text-sm leading-relaxed mb-6">
                Your trusted companion for finding the perfect smartphone. We
                compare prices, specifications, and reviews to help you make the
                smartest buying decision.
              </h6>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
              {/* Company */}
              <div>
                <h3 className="font-heading font-semibold text-lg mb-6 text-white">
                  Company
                </h3>
                <ul className="space-y-3">
                  {["About Us", "Press", "Blog", "Brand Resources"].map(
                    (item, index) => (
                      <li key={index}>
                        <a
                          href="#"
                          className="text-gray-400 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2 group"
                        >
                          <FaChevronRight className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                          {item}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Help & Support */}
              <div>
                <h3 className="font-heading font-semibold text-lg mb-6 text-white">
                  Help & Support
                </h3>
                <ul className="space-y-3">
                  {[
                    "Help Center",
                    "Contact Us",
                    "Privacy Policy",
                    "Terms of Service",
                    "Cookie Policy",
                  ].map((item, index) => (
                    <li key={index}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2 group"
                      >
                        <FaChevronRight className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Partners */}
            </div>
          </div>
        </div>

        {/* Middle Section - Connect & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Connect with Us */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-6 text-white">
              Connect with Us
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  icon: FaFacebook,
                  label: "Facebook",
                  color: "hover:bg-blue-600",
                  bg: "bg-blue-500/10",
                  text: "text-blue-400",
                },
                {
                  icon: FaTwitter,
                  label: "Twitter",
                  color: "hover:bg-sky-500",
                  bg: "bg-sky-500/10",
                  text: "text-sky-400",
                },
                {
                  icon: FaInstagram,
                  label: "Instagram",
                  color: "hover:bg-pink-600",
                  bg: "bg-pink-500/10",
                  text: "text-pink-400",
                },
                {
                  icon: FaLinkedin,
                  label: "LinkedIn",
                  color: "hover:bg-blue-700",
                  bg: "bg-blue-700/10",
                  text: "text-blue-400",
                },
                {
                  icon: FaYoutube,
                  label: "YouTube",
                  color: "hover:bg-red-600",
                  bg: "bg-red-500/10",
                  text: "text-red-400",
                },
                {
                  icon: FaGithub,
                  label: "GitHub",
                  color: "hover:bg-gray-800",
                  bg: "bg-gray-700/10",
                  text: "text-gray-400",
                },
              ].map((social, index) => (
                <a
                  key={index}
                  href="#"
                  className={`${social.bg} ${social.text} ${social.color} w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg`}
                  aria-label={social.label}
                >
                  <social.icon className="text-lg" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-6 text-white">
              Stay Updated
            </h3>
            <h6 className="text-white text-sm mb-6">
              Get the latest smartphone deals, reviews, and tech news delivered
              to your inbox.
            </h6>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                         text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 
                         flex items-center justify-center gap-2"
              >
                <FaRocket className="text-sm" />
                Subscribe Now
              </button>
              <h6 className="text-xs text-gray-500 text-center">
                No spam. Unsubscribe anytime.
              </h6>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h6 className="text-gray-400 text-sm">
                © {new Date().getFullYear()} TechNex. All rights reserved.
              </h6>
              <h6 className="text-gray-500 text-xs mt-1">
                Smart Comparison Made Easy
              </h6>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
