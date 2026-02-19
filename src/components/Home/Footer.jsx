// src/components/Footer.jsx
import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white relative">
      {/* Purple-Indigo gradient accent line */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Top Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          {/* Mobiles */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
              Smartphones
            </h4>
            <ul className="space-y-2.5 text-gray-400 text-xs sm:text-sm">
              <li>
                <Link
                  to="/smartphones"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  All Smartphones
                </Link>
              </li>
              <li>
                <Link
                  to="/trending/smartphones"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Trending Smartphones
                </Link>
              </li>
              <li>
                <Link
                  to="/smartphones?filter=new"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  New Launches
                </Link>
              </li>
              <li>
                <Link
                  to="/compare"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Compare Smartphones
                </Link>
              </li>
            </ul>
          </div>

          {/* Laptops */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
              Laptops
            </h4>
            <ul className="space-y-2.5 text-gray-400 text-xs sm:text-sm">
              <li>
                <Link
                  to="/laptops"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  All Laptops
                </Link>
              </li>
              <li>
                <Link
                  to="/trending/laptops"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Trending Laptops
                </Link>
              </li>
              <li>
                <Link
                  to="/laptops?filter=new"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  New Launches
                </Link>
              </li>
              <li>
                <Link
                  to="/compare"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Compare Laptops
                </Link>
              </li>
            </ul>
          </div>

          {/* TVs */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
              TVs
            </h4>
            <ul className="space-y-2.5 text-gray-400 text-xs sm:text-sm">
              <li>
                <Link
                  to="/tvs"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  All TVs
                </Link>
              </li>
              <li>
                <Link
                  to="/trending/tvs"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Trending TVs
                </Link>
              </li>
              <li>
                <Link
                  to="/tvs?filter=new"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  New Launches
                </Link>
              </li>
              <li>
                <Link
                  to="/compare"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Compare TVs
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-gray-400 text-xs sm:text-sm">
              <li>
                <Link
                  to="/"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/compare"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Compare Devices
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  to="/account"
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
        </div>

        {/* Hook - Separate Row with Border Divider + Newsletter */}
        <div className="border-t border-gray-700 py-8 sm:py-10 px-0">
          <h4 className="text-sm font-bold mb-6 text-white uppercase tracking-wide">
            Hook
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Link
                  to="/about"
                  className="hover:text-purple-400 transition-colors duration-200 text-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                >
                  About Us
                </Link>
              </div>
              <div>
                <Link
                  to="/contact"
                  className="hover:text-purple-400 transition-colors duration-200 text-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                >
                  Contact
                </Link>
              </div>
              <div>
                <Link
                  to="/privacy-policy"
                  className="hover:text-purple-400 transition-colors duration-200 text-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                >
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link
                  to="/terms"
                  className="hover:text-purple-400 transition-colors duration-200 text-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                >
                  Terms & Conditions
                </Link>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-gray-400 text-xs sm:text-sm mb-3">
                Subscribe to get the latest deals, reviews & updates.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // simple client-side feedback
                  const form = e.currentTarget;
                  const input = form.querySelector('input[name="email"]');
                  if (input && input.value) {
                    // eslint-disable-next-line no-alert
                    alert("Thanks for subscribing!");
                    input.value = "";
                  }
                }}
                className="flex gap-2 max-w-md"
                aria-label="Subscribe to newsletter"
              >
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 text-sm rounded bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-10 sm:my-12"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Copyright */}
          <div className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Hook. All rights reserved.
          </div>

          {/* Social Media */}
          <div className="flex items-center gap-3 sm:gap-4">
            {[
              {
                icon: FaFacebook,
                label: "Facebook",
                url: "https://facebook.com",
              },
              { icon: FaTwitter, label: "Twitter", url: "https://twitter.com" },
              {
                icon: FaInstagram,
                label: "Instagram",
                url: "https://instagram.com",
              },
              {
                icon: FaLinkedin,
                label: "LinkedIn",
                url: "https://linkedin.com",
              },
              { icon: FaYoutube, label: "YouTube", url: "https://youtube.com" },
            ].map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <social.icon className="text-base sm:text-lg" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
