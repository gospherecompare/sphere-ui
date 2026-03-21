// src/components/Footer.jsx
import React, { useEffect, useState } from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const toText = (value) => String(value || "").trim();

const normalizePhoneRows = (json) => {
  if (Array.isArray(json?.new)) return json.new;
  if (Array.isArray(json?.trending)) return json.trending;
  if (Array.isArray(json?.smartphones)) return json.smartphones;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json)) return json;
  return [];
};

const buildFooterPhones = (rows = [], limit = 5) => {
  const seen = new Set();
  const phones = [];

  for (const row of rows) {
    const name = toText(
      row?.name || row?.product_name || row?.model || row?.title || "",
    );
    if (!name) continue;

    const productId = row?.product_id ?? row?.productId ?? row?.id ?? null;
    const key = `${String(productId ?? "")}|${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const basePath = createProductPath("smartphones", name);
    const path =
      productId != null && productId !== ""
        ? `${basePath}?id=${encodeURIComponent(String(productId))}`
        : basePath;

    phones.push({
      id: productId ?? name,
      name,
      path,
    });

    if (phones.length >= limit) break;
  }

  return phones;
};

const Footer = () => {
  const [footerPhones, setFooterPhones] = useState([]);
  const [footerPhonesLabel, setFooterPhonesLabel] =
    useState("New Mobile Phones");
  const [topPickPhones, setTopPickPhones] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadPrimaryFooterPhones = async () => {
      const sources = [
        {
          label: "New Mobile Phones",
          url: `${API_BASE}/api/public/new/smartphones?limit=20`,
        },
        {
          label: "Trending Mobile Phones",
          url: `${API_BASE}/api/public/trending/smartphones?limit=20`,
        },
      ];

      for (const source of sources) {
        try {
          const response = await fetch(source.url, { cache: "no-store" });
          if (!response.ok) continue;
          const json = await response.json();
          const rows = normalizePhoneRows(json);
          const phones = buildFooterPhones(rows, 5);
          if (phones.length > 0) {
            if (!cancelled) {
              setFooterPhones(phones);
              setFooterPhonesLabel(source.label);
            }
            return;
          }
        } catch {
          // Try next fallback source
        }
      }

      if (!cancelled) setFooterPhones([]);
    };

    const loadTopPicks = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/smartphones`, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) setTopPickPhones([]);
          return;
        }
        const json = await response.json();
        const rows = normalizePhoneRows(json);
        const phones = buildFooterPhones(rows, 5);
        if (!cancelled) setTopPickPhones(phones);
      } catch {
        if (!cancelled) setTopPickPhones([]);
      }
    };

    loadPrimaryFooterPhones();
    loadTopPicks();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-black text-white relative ">
      {/* Purple-Indigo gradient accent line */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
        {footerPhones.length > 0 || topPickPhones.length > 0 ? (
          <div className="mb-10 border-y border-gray-800 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {footerPhones.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
                    {footerPhonesLabel}
                  </h4>
                  <div className="grid grid-cols-1 gap-y-2">
                    {footerPhones.map((phone) => (
                      <Link
                        key={`${String(phone.id)}-primary`}
                        to={phone.path}
                        className="text-[12px] text-gray-300 hover:text-purple-400 transition-colors duration-200 truncate"
                        title={phone.name}
                      >
                        {phone.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {topPickPhones.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
                    Top Picks by Hooks
                  </h4>
                  <div className="grid grid-cols-1 gap-y-2">
                    {topPickPhones.map((phone) => (
                      <Link
                        key={`${String(phone.id)}-top-pick`}
                        to={phone.path}
                        className="text-[12px] text-gray-300 hover:text-purple-400 transition-colors duration-200 truncate"
                        title={phone.name}
                      >
                        {phone.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

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
                  to="/smartphones/filter/new"
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

        {/* Hooks - Separate Row with Border Divider + Newsletter */}
        <div className="border-t border-gray-700 pt-8 pb-1">
          <h4 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">
            Hooks
          </h4>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-gray-400 text-xs sm:text-sm">
            <Link
              to="/about"
              className="hover:text-purple-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              About Us
            </Link>
            <Link
              to="/careers"
              className="hover:text-purple-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              Careers
            </Link>
            <Link
              to="/contact"
              className="hover:text-purple-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              Contact
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-purple-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-purple-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8 sm:my-10"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Copyright */}
          <div className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Hooks. All rights reserved.
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
