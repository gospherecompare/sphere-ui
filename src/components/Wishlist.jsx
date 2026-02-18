import React, { useState, useEffect, useMemo } from "react";
import { useDevice } from "../hooks/useDevice";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Helmet } from "react-helmet-async";
import {
  FaHeart,
  FaTrash,
  FaShoppingCart,
  FaArrowRight,
  FaStar,
  FaBox,
  FaRupeeSign,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import "../styles/hideScrollbar.css";
import { generateSlug } from "../utils/slugGenerator";

const API_BASE_URL = "http://localhost:5000/api";

const Wishlist = () => {
  const navigate = useNavigate();
  const {
    smartphone = [],
    laptops = [],
    networking = [],
    homeAppliances = [],
  } = useDevice();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Combine all device data
  const allDevices = useMemo(
    () => [
      ...smartphone.map((d) => ({
        ...d,
        type: "smartphone",
        category: "Smartphones",
      })),
      ...laptops.map((d) => ({ ...d, type: "laptop", category: "Laptops" })),
      ...networking.map((d) => ({
        ...d,
        type: "networking",
        category: "Networking",
      })),
      ...homeAppliances.map((d) => ({
        ...d,
        type: "homeAppliance",
        category: "Appliances",
      })),
    ],
    [smartphone, laptops, networking, homeAppliances],
  );

  // Load wishlist items from cookies
  useEffect(() => {
    const token = Cookies.get("arenak");

    const mapApiEntryToItem = (entry) => {
      // Accept several possible shapes from server
      const pid =
        entry.product_id ||
        entry.productId ||
        entry.product?.id ||
        entry.id ||
        entry.product_id;
      const ptype = (
        entry.product_type ||
        entry.type ||
        entry.product?.product_type ||
        "smartphone"
      )
        .toString()
        .toLowerCase();

      // Try to enrich using loaded device lists
      const device = allDevices.find(
        (d) =>
          String(d.id) === String(pid) ||
          String(d.model) === String(pid) ||
          String(d.product_id) === String(pid) ||
          String(d.model_number) === String(pid),
      );

      if (device) {
        return {
          ...device,
          type: device.type || ptype,
          category:
            device.category ||
            (ptype === "laptop"
              ? "Laptops"
              : ptype === "homeappliance"
                ? "Appliances"
                : ptype === "networking"
                  ? "Networking"
                  : "Smartphones"),
          favoriteId: pid,
        };
      }

      // Fallback minimal mapping when product details are returned directly
      return {
        favoriteId: pid,
        name: entry.name || entry.product?.name || entry.product_name,
        brand: entry.brand || entry.product?.brand || entry.brand_name,
        base_price:
          entry.base_price || entry.price || entry.product?.base_price,
        image_url: entry.image_url || entry.product?.image_url,
        type: ptype,
        category:
          ptype === "laptop"
            ? "Laptops"
            : ptype === "homeappliance"
              ? "Appliances"
              : ptype === "networking"
                ? "Networking"
                : "Smartphones",
      };
    };

    const loadFromCookies = () => {
      const favorites = {
        smartphones: JSON.parse(Cookies.get("favoriteDevices") || "[]"),
        laptops: JSON.parse(Cookies.get("favoriteLaptops") || "[]"),
        appliances: JSON.parse(Cookies.get("favoriteAppliances") || "[]"),
        networking: JSON.parse(
          Cookies.get("favoriteNetworkingDevices") || "[]",
        ),
      };

      const items = [];
      favorites.smartphones.forEach((fav) => {
        const device = smartphone.find((d) => d.id === fav || d.model === fav);
        if (device)
          items.push({
            ...device,
            type: "smartphone",
            category: "Smartphones",
            favoriteId: fav,
          });
      });
      favorites.laptops.forEach((fav) => {
        const device = laptops.find(
          (d) => d.id === fav || d.model_number === fav,
        );
        if (device)
          items.push({
            ...device,
            type: "laptop",
            category: "Laptops",
            favoriteId: fav,
          });
      });
      favorites.appliances.forEach((fav) => {
        const device = homeAppliances.find(
          (d) => d.id === fav || d.model_number === fav,
        );
        if (device)
          items.push({
            ...device,
            type: "homeAppliance",
            category: "Appliances",
            favoriteId: fav,
          });
      });
      favorites.networking.forEach((fav) => {
        const device = networking.find(
          (d) => d.id === fav || d.model_number === fav,
        );
        if (device)
          items.push({
            ...device,
            type: "networking",
            category: "Networking",
            favoriteId: fav,
          });
      });

      setWishlistItems(items);
      setLoading(false);
    };

    const loadFromApi = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/wishlist", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.status === 401) {
          setLoading(false);
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Wishlist fetch failed: ${res.status}`);
        const json = await res.json();
        const data = json.rows || json.wishlist || json.items || json || [];
        const mapped = (Array.isArray(data) ? data : []).map(mapApiEntryToItem);
        setWishlistItems(mapped.filter(Boolean));
      } catch (err) {
        console.error("Failed to load wishlist from API:", err);
        // fallback to cookies if API fails
        loadFromCookies();
      } finally {
        setLoading(false);
      }
    };

    // If the user is authenticated, prefer server-side wishlist
    if (token) {
      loadFromApi();
    } else if (
      smartphone.length > 0 ||
      laptops.length > 0 ||
      networking.length > 0 ||
      homeAppliances.length > 0
    ) {
      loadFromCookies();
    }
  }, [smartphone, laptops, networking, homeAppliances, allDevices, navigate]);

  const handleRemoveFromWishlist = (item) => {
    setDeletingId(item.favoriteId);

    const token = Cookies.get("arenak");

    // If authenticated, call server API
    if (token) {
      (async () => {
        try {
          const res = await fetch(
            `http://localhost:5000/api/wishlist/${encodeURIComponent(
              item.favoriteId,
            )}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (res.status === 401) {
            navigate("/login");
            return;
          }

          if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

          // Remove locally after successful deletion
          setWishlistItems((prev) =>
            prev.filter((w) => w.favoriteId !== item.favoriteId),
          );
        } catch (err) {
          console.error("Failed to remove wishlist item via API:", err);
        } finally {
          setDeletingId(null);
        }
      })();
      return;
    }

    // Fallback: use cookies for anonymous users
    setTimeout(() => {
      let cookieKey = "";
      if (item.type === "smartphone") cookieKey = "favoriteDevices";
      else if (item.type === "laptop") cookieKey = "favoriteLaptops";
      else if (item.type === "homeAppliance") cookieKey = "favoriteAppliances";
      else if (item.type === "networking")
        cookieKey = "favoriteNetworkingDevices";

      if (cookieKey) {
        const favorites = JSON.parse(Cookies.get(cookieKey) || "[]");
        const updated = favorites.filter((fav) => fav !== item.favoriteId);
        Cookies.set(cookieKey, JSON.stringify(updated), {
          expires: 365,
          sameSite: "strict",
        });
      }

      setWishlistItems((prev) =>
        prev.filter((w) => w.favoriteId !== item.favoriteId),
      );
      setDeletingId(null);
    }, 300);
  };

  // Add item to wishlist via API (authenticated) or cookies (fallback)
  // Note: This function could be used if wishlist add functionality is needed outside the card
  const _addToWishlist = async (productId, type = "smartphone") => {
    const token = Cookies.get("arenak");
    setError(null);
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/wishlist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: productId, product_type: type }),
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Add wishlist failed: ${res.status}`);

        const json = await res.json();
        // Normalize possible response shapes: { item: {...} } or direct
        const returned =
          json.item || json.row || json.wishlist_item || json || {};

        const newItem = {
          favoriteId: returned.product_id || returned.id || productId,
          name: returned.name || returned.product_name,
          brand: returned.brand_name || returned.brand,
          base_price: returned.base_price || returned.price,
          image_url:
            (returned.images && returned.images[0]) || returned.image_url,
          type,
        };

        setWishlistItems((prev) => [...prev, newItem]);
        setSuccessMessage("Added to wishlist!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error("Failed to add wishlist item via API:", err);
        setError("Failed to add to wishlist.");
      }
      return;
    }

    // Fallback cookie behavior for anonymous users
    const cookieKey =
      type === "smartphone"
        ? "favoriteDevices"
        : type === "laptop"
          ? "favoriteLaptops"
          : type === "homeAppliance"
            ? "favoriteAppliances"
            : "favoriteNetworkingDevices";
    const favorites = JSON.parse(Cookies.get(cookieKey) || "[]");
    if (!favorites.includes(productId)) favorites.push(productId);
    Cookies.set(cookieKey, JSON.stringify(favorites), {
      expires: 365,
      sameSite: "strict",
    });
  };

  const handleViewProduct = (item) => {
    const slug = generateSlug(
      item.name || item.model || item.product_name || "",
    );
    const routes = {
      smartphone: "/smartphones",
      laptop: "/laptops",
      homeAppliance: "/tvs",
      networking: "/networking",
    };
    navigate(`${routes[item.type]}/${slug}`);
  };

  const getProductImage = (item) => {
    return (
      item.image_url ||
      item.images?.[0] ||
      item.primary_image ||
      "https://via.placeholder.com/250x250?text=Product"
    );
  };

  const getProductPrice = (item) => {
    const price = item.base_price || item.starting_price || "N/A";
    if (price === "N/A") return price;
    return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
  };

  const getProductBrand = (item) => {
    return item.brand || item.manufacturer || "Unknown";
  };

  const getProductModel = (item) => {
    return item.model || item.product_name || item.model_number || "Unknown";
  };

  const getProductDescription = (item) => {
    return item.description || item.features?.[0] || "";
  };

  const groupedItems = useMemo(() => {
    const groups = {};
    wishlistItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [wishlistItems]);

  const totalItems = wishlistItems.length;

  const averagePrice = useMemo(() => {
    if (!wishlistItems || wishlistItems.length === 0) return 0;
    const prices = wishlistItems
      .map((i) => Number(i.base_price || i.starting_price || 0))
      .filter((p) => !Number.isNaN(p) && p > 0);
    if (!prices.length) return 0;
    const sum = prices.reduce((s, v) => s + v, 0);
    return Math.round(sum / prices.length);
  }, [wishlistItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Loading Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>

          {/* Loading Items Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse flex-shrink-0"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist - SmartArena</title>
        <meta
          name="description"
          content="View and manage your favorite products"
        />
      </Helmet>

      <div className="max-w-6xl mx-auto min-h-screen bg-white py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-8">
        <div className="">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <FaExclamationCircle className="text-red-600 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-600 hover:underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <FaCheckCircle className="text-green-600 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-green-800 font-semibold text-sm">
                {successMessage}
              </p>
            </div>
          )}

          {/* Page Header Section */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-full">
                <FaHeart className="text-blue-600 text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  My Wishlist
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {wishlistItems.length} item
                  {wishlistItems.length !== 1 ? "s" : ""} saved for later
                </p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {wishlistItems.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-blue-100 border border-gray-200 rounded-xl p-8 sm:p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-full border-2 border-gray-200">
                  <FaBox className="text-gray-300 text-5xl sm:text-6xl" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Start adding your favorite tech products to your wishlist!
                Browse our collection of smartphones, laptops, appliances, and
                networking devices.
              </p>
              <button
                onClick={() => navigate("/")}
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700 rounded-full"></div>
                Browse Products <FaArrowRight className="text-xs" />
              </button>
            </div>
          ) : (
            <>
              {/* Summary Stats Card */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-blue-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                        Total Items
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">
                        {totalItems}
                      </p>
                    </div>
                    <FaBox className="text-blue-300 text-3xl" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-blue-600 border border-purple-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">
                        Average Price
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-2">
                        ₹{new Intl.NumberFormat("en-IN").format(averagePrice)}
                      </p>
                    </div>
                    <FaRupeeSign className="text-purple-300 text-3xl" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-blue-600 border border-green-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">
                        Categories
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">
                        {Object.keys(groupedItems).length}
                      </p>
                    </div>
                    <FaHeart className="text-green-300 text-3xl" />
                  </div>
                </div>
              </div>

              {/* Items by Category */}
              {Object.entries(groupedItems).map(([category, items], idx) => (
                <div
                  key={category}
                  className={idx !== 0 ? "mt-10 sm:mt-12" : ""}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b-2 border-gray-200">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        {category}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {items.length} product{items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Category Items */}
                  <div className="space-y-3 sm:space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.favoriteId}
                        className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all duration-300 group ${
                          deletingId === item.favoriteId
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-5">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden group-hover:border-gray-300 transition-colors">
                              <img
                                src={getProductImage(item)}
                                alt={getProductModel(item)}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                              {getProductBrand(item)}
                            </p>
                            <h3
                              className="text-xs sm:text-sm font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2 mb-2"
                              onClick={() => handleViewProduct(item)}
                            >
                              {getProductModel(item)}
                            </h3>
                            {getProductDescription(item) && (
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {getProductDescription(item)}
                              </p>
                            )}
                          </div>

                          {/* Price & Actions */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            {/* Price */}
                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-bold text-gray-900">
                                {getProductPrice(item)}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleRemoveFromWishlist(item)}
                              className="group/btn bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 font-semibold py-1.5 px-3 sm:px-4 rounded-lg transition-all duration-200 text-xs whitespace-nowrap disabled:opacity-60"
                              disabled={deletingId === item.favoriteId}
                            >
                              {deletingId === item.favoriteId
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom CTA */}
              <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200">
                <button
                  onClick={() => navigate("/compare")}
                  className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700 rounded-full"></div>
                  Compare Selected Items
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
