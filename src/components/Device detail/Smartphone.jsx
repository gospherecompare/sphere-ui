// src/components/MobileDetailCard.jsx
import React, { useState, useEffect } from "react";
import { useDevice } from "../../hooks/useDevice";
import useTitle from "../../hooks/useTitle";
import {
  FaStar,
  FaHeart,
  FaShare,
  FaCamera,
  FaBatteryFull,
  FaMemory,
  FaMicrochip,
  FaMobile,
  FaExpand,
  FaWifi,
  FaBluetooth,
  FaShieldAlt,
  FaWater,
  FaBolt,
  FaSync,
  FaFilm,
  FaVolumeUp,
  FaGamepad,
  FaShoppingCart,
  FaBalanceScale,
  FaChevronRight,
  FaStore,
  FaChevronLeft,
  FaChevronDown,
  FaExternalLinkAlt,
  FaTag,
  FaCopy,
  FaCheck,
  FaShareAlt,
  FaInfoCircle,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLink,
  FaEnvelope,
  FaRegStar,
  FaStarHalfAlt,
  FaPlus,
  FaChartBar,
} from "react-icons/fa";
import { STORE_LOGOS } from "../../constants/storeLogos";
import "../../styles/hideScrollbar.css";
import Spinner from "../ui/Spinner";
import RatingInput from "../ui/RatingInput";

// Simple inline RatingInput component if the imported one isn't working
const InlineRatingInput = ({
  value,
  onChange,
  size = "md",
  readOnly = false,
}) => {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const renderStar = (position) => {
    const fullStar = value >= position;
    const halfStar = value >= position - 0.5 && value < position;

    if (fullStar) {
      return (
        <FaStar
          className={`${sizes[size]} cursor-pointer text-yellow-400 ${
            readOnly ? "" : "hover:text-yellow-500"
          }`}
          onClick={() => handleClick(position)}
        />
      );
    } else if (halfStar) {
      return (
        <FaStarHalfAlt
          className={`${sizes[size]} cursor-pointer text-yellow-400 ${
            readOnly ? "" : "hover:text-yellow-500"
          }`}
          onClick={() => handleClick(position)}
        />
      );
    } else {
      return (
        <FaRegStar
          className={`${sizes[size]} cursor-pointer text-gray-300 ${
            readOnly ? "" : "hover:text-yellow-300"
          }`}
          onClick={() => handleClick(position)}
        />
      );
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="cursor-pointer">
          {renderStar(star)}
        </span>
      ))}
      {!readOnly && (
        <span className="ml-2 text-sm text-gray-600">{value.toFixed(1)}/5</span>
      )}
    </div>
  );
};

const MobileDetailCard = () => {
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingsData, setRatingsData] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    display: 0,
    performance: 0,
    camera: 0,
    battery: 0,
    design: 0,
  });
  const [editingReview, setEditingReview] = useState(null);
  const { selectedDevice, fetchDevice, loading, error } = useDevice();

  const query = new URLSearchParams(window.location.search);
  const model = query.get("model");
  const id = query.get("id");
  const variantQuery = query.get("variantId") || query.get("variant_id");
  const storeQuery = query.get("storeId") || query.get("store_id");

  useEffect(() => {
    if (id) fetchDevice(id);
    else if (model) fetchDevice(model);
  }, [id, model, fetchDevice]);

  const mobileData = selectedDevice?.smartphones?.[0] || selectedDevice;

  useTitle({
    brand: mobileData?.brand,
    name: mobileData?.name,
  });

  useEffect(() => {
    if (error) console.error("Device fetch error:", error);
  }, [error]);

  // Fetch ratings and reviews when device data is loaded
  useEffect(() => {
    if (mobileData?.id || mobileData?.smartphoneId) {
      fetchRatingsAndReviews();
    }
  }, [mobileData]);

  const fetchRatingsAndReviews = async () => {
    try {
      // Only fetch ratings summary. Reviews UI remains, but review data
      // is not populated from server (reviews functionality disabled).
      const deviceId = mobileData.id || mobileData.smartphoneId;
      const ratingsResponse = await fetch(
        `http://localhost:5000/api/public/smartphone/${deviceId}/rating`
      );
      let ratings = null;
      if (ratingsResponse.ok) ratings = await ratingsResponse.json();

      if (
        (!ratings || Object.keys(ratings).length === 0) &&
        mobileData.averageRating
      ) {
        setRatingsData({
          averageRating: parseFloat(mobileData.averageRating),
          totalRatings: parseInt(mobileData.totalRatings) || 0,
          display: parseFloat(mobileData.display) || 0,
          performance: parseFloat(mobileData.performance) || 0,
          camera: parseFloat(mobileData.camera) || 0,
          battery: parseFloat(mobileData.battery) || 0,
          design: parseFloat(mobileData.design) || 0,
        });
      } else if (ratings) {
        setRatingsData({
          averageRating:
            ratings.averageRating != null
              ? parseFloat(ratings.averageRating)
              : 0,
          totalRatings: parseInt(ratings.totalRatings) || 0,
          display: parseFloat(ratings.display) || 0,
          performance: parseFloat(ratings.performance) || 0,
          camera: parseFloat(ratings.camera) || 0,
          battery: parseFloat(ratings.battery) || 0,
          design: parseFloat(ratings.design) || 0,
        });
      }

      // Reviews are disabled; do not populate review list from server.
    } catch (error) {
      console.error("Error fetching ratings:", error);
      if (mobileData.averageRating) {
        setRatingsData({
          averageRating: parseFloat(mobileData.averageRating),
          totalRatings: parseInt(mobileData.totalRatings) || 1,
          display: parseFloat(mobileData.display) || 5.0,
          performance: parseFloat(mobileData.performance) || 5.0,
          camera: parseFloat(mobileData.camera) || 2.0,
          battery: parseFloat(mobileData.battery) || 2.0,
          design: parseFloat(mobileData.design) || 2.0,
        });
      }
    }
  };

  const variants =
    mobileData?.variants ?? (mobileData?.variant ? [mobileData.variant] : []);

  useEffect(() => {
    if (selectedVariant >= variants.length) setSelectedVariant(0);
  }, [variants, selectedVariant]);

  useEffect(() => {
    if (!variants || variants.length === 0) return;
    if (variantQuery) {
      const idx = variants.findIndex(
        (v) =>
          String(v.variant_id ?? v.id ?? v.variantId) === String(variantQuery)
      );
      if (idx >= 0) setSelectedVariant(idx);
    }
    if (storeQuery) {
      setActiveStoreId(String(storeQuery));
    }
  }, [variants, variantQuery, storeQuery]);

  const currentVariant = variants?.[selectedVariant];

  const allStorePrices =
    variants.flatMap(
      (variant) =>
        variant.store_prices?.map((store) => ({
          ...store,
          variantName: `${variant.ram} ${variant.storage} ${variant.color_name}`,
          variantRam: variant.ram,
          variantStorage: variant.storage,
          variantColor: variant.color_name,
        })) || []
    ) || [];

  const variantStorePrices =
    currentVariant?.store_prices?.map((sp) => ({
      ...sp,
      variantName: `${currentVariant.ram} ${currentVariant.storage} ${currentVariant.color_name}`,
      variantRam: currentVariant.ram,
      variantStorage: currentVariant.storage,
      variantColor: currentVariant.color_name,
    })) || [];

  const getStoreLogo = (storeName) => {
    const storeKey = storeName?.toLowerCase().replace(/[^a-z0-9]/g, "");
    return STORE_LOGOS[storeKey] || STORE_LOGOS.default;
  };

  const formatPrice = (price) => {
    if (price == null || price === "") return "N/A";
    const str = String(price);
    const numericPrice = parseInt(str.replace(/[^0-9]/g, "")) || 0;
    return new Intl.NumberFormat("en-IN").format(numericPrice);
  };

  const toNormalCase = (raw) => {
    if (raw == null) return "";
    const ACRONYMS = new Set([
      "MP",
      "FOV",
      "ROM",
      "RAM",
      "NFC",
      "GPS",
      "USB",
      "AI",
      "OS",
      "GPU",
      "CPU",
      "Hz",
      "FPS",
      "GB",
      "mah",
      "Ghz",
      "cm",
      "gm",
      "IP",
      "5g",
      "K",
      "X",
      "Li-on",
    ]);

    let s = String(raw);
    s = s.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");

    const parts = s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

    const normalized = parts
      .map((w) => {
        const clean = w.replace(/[^a-zA-Z0-9/()-]/g, "");
        const upper = clean.toUpperCase();
        if (ACRONYMS.has(upper)) return upper;
        if (/\d/.test(w) || /\//.test(w) || /[()\-]/.test(w)) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");

    return normalized;
  };

  const sortedStores = allStorePrices.slice().sort((a, b) => {
    const priceA =
      parseInt(String(a?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    const priceB =
      parseInt(String(b?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    return priceA - priceB;
  });

  const sortedVariantStores = variantStorePrices.slice().sort((a, b) => {
    const priceA =
      parseInt(String(a?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    const priceB =
      parseInt(String(b?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    return priceA - priceB;
  });

  const displayedStores = showAllStores
    ? sortedStores
    : sortedVariantStores.slice(0, 3);

  // Share functionality
  const shareData = {
    title: `${mobileData?.brand} ${mobileData?.model}`,
    text: `Check out ${mobileData?.brand} ${mobileData?.model} - ${
      mobileData?.performance?.processor
    }, ${mobileData?.camera?.main_camera_megapixels || ""}MP Camera, ${
      mobileData?.battery?.battery_capacity_mah || ""
    }mAh Battery. Price starts at ₹${
      currentVariant?.base_price
        ? formatPrice(currentVariant.base_price)
        : "N/A"
    }`,
    url: window.location.href,
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const shareToWhatsApp = () => {
    const message = `${shareData.title}\n${shareData.text}\n\n${shareData.url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      window.location.href
    )}`;
    window.open(url, "_blank");
  };

  const shareToTwitter = () => {
    const tweet = `${shareData.title} - ${shareData.text.substring(0, 100)}...`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweet
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = () => {
    const subject = `Check out ${shareData.title}`;
    const body = `${shareData.text}\n\n${shareData.url}`;
    const url = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    const favorites = JSON.parse(
      localStorage.getItem("favoriteDevices") || "[]"
    );
    if (!isFavorite) {
      favorites.push(mobileData?.id || mobileData?.model);
      localStorage.setItem("favoriteDevices", JSON.stringify(favorites));
    } else {
      const updated = favorites.filter(
        (id) => id !== (mobileData?.id || mobileData?.model)
      );
      localStorage.setItem("favoriteDevices", JSON.stringify(updated));
    }
  };

  // FIXED: Rating and Review Functions
  const handleRatingChange = (category, value) => {
    if (editingReview) {
      const updatedReview = { ...editingReview, [category]: value };

      // Recalculate overall rating if it's a category change
      if (category !== "rating") {
        const categories = [
          "display",
          "performance",
          "camera",
          "battery",
          "design",
        ];
        const sum = categories.reduce(
          (total, cat) => total + (updatedReview[cat] || 0),
          0
        );
        updatedReview.rating = parseFloat((sum / categories.length).toFixed(1));
      }

      setEditingReview(updatedReview);
    } else {
      const updatedReview = { ...newReview, [category]: value };

      // Recalculate overall rating if it's a category change
      if (category !== "rating") {
        const categories = [
          "display",
          "performance",
          "camera",
          "battery",
          "design",
        ];
        const sum = categories.reduce(
          (total, cat) => total + (updatedReview[cat] || 0),
          0
        );
        updatedReview.rating = parseFloat((sum / categories.length).toFixed(1));
      }

      setNewReview(updatedReview);
    }
  };

  const submitReview = async () => {
    try {
      const reviewToSubmit = editingReview || newReview;

      // Ensure numeric category ratings
      const display = Number(reviewToSubmit.display) || 0;
      const performance = Number(reviewToSubmit.performance) || 0;
      const camera = Number(reviewToSubmit.camera) || 0;
      const battery = Number(reviewToSubmit.battery) || 0;
      const design = Number(reviewToSubmit.design) || 0;
      const overallRating = Number(reviewToSubmit.rating) || 0;

      const reviewData = {
        ...reviewToSubmit,
        rating: overallRating,
        display,
        performance,
        camera,
        battery,
        design,
        deviceId: mobileData.id || mobileData.smartphoneId,
        userId: "current-user-id",
        userName: "Current User",
        date: new Date().toISOString(),
      };

      // Update local ratings data for immediate UI feedback
      if (ratingsData) {
        const prev = ratingsData;
        const oldTotal = Number(prev.totalRatings) || 0;
        const newTotal = oldTotal + 1;

        const newDisplay =
          oldTotal > 0
            ? parseFloat(
                (
                  (Number(prev.display || 0) * oldTotal + display) /
                  newTotal
                ).toFixed(1)
              )
            : display;
        const newPerformance =
          oldTotal > 0
            ? parseFloat(
                (
                  (Number(prev.performance || 0) * oldTotal + performance) /
                  newTotal
                ).toFixed(1)
              )
            : performance;
        const newCamera =
          oldTotal > 0
            ? parseFloat(
                (
                  (Number(prev.camera || 0) * oldTotal + camera) /
                  newTotal
                ).toFixed(1)
              )
            : camera;
        const newBattery =
          oldTotal > 0
            ? parseFloat(
                (
                  (Number(prev.battery || 0) * oldTotal + battery) /
                  newTotal
                ).toFixed(1)
              )
            : battery;
        const newDesign =
          oldTotal > 0
            ? parseFloat(
                (
                  (Number(prev.design || 0) * oldTotal + design) /
                  newTotal
                ).toFixed(1)
              )
            : design;

        const newAverage = parseFloat(
          (
            (newDisplay + newPerformance + newCamera + newBattery + newDesign) /
            5
          ).toFixed(1)
        );

        setRatingsData({
          averageRating: newAverage,
          totalRatings: newTotal,
          display: newDisplay,
          performance: newPerformance,
          camera: newCamera,
          battery: newBattery,
          design: newDesign,
        });
      }

      // Submit to server (fire-and-forget)
      try {
        const deviceId = mobileData.id || mobileData.smartphoneId;
        await fetch(
          `http://localhost:5000/api/public/smartphone/${deviceId}/rating`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              display,
              performance,
              camera,
              battery,
              design,
            }),
          }
        );
      } catch (err) {
        console.error("Network error when submitting rating:", err);
      }

      // Reset form
      setNewReview({
        rating: 0,
        display: 0,
        performance: 0,
        camera: 0,
        battery: 0,
        design: 0,
      });
      setEditingReview(null);
      setShowReviewForm(false);

      // Show success message
      alert("Thank you for your rating! Your feedback has been recorded.");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("There was an error submitting your rating. Please try again.");
    }
  };

  const handleReplySubmit = async (reviewId) => {
    // Replies are disabled in this build.
    console.log("Replies disabled for review id:", reviewId);
  };

  const deleteReview = async (reviewId) => {
    // Review deletion is disabled. No-op.
    console.log("Delete review disabled for id:", reviewId);
  };

  const likeReview = async (reviewId) => {
    // Likes are disabled.
    console.log("Like disabled for review id:", reviewId);
  };

  const dislikeReview = async (reviewId) => {
    // Dislikes are disabled.
    console.log("Dislike disabled for review id:", reviewId);
  };

  // Render stars for rating display
  const renderStars = (rating, size = "sm") => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const sizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar
            key={`full-${i}`}
            className={`text-yellow-400 ${sizeClasses[size] || sizeClasses.sm}`}
          />
        ))}
        {hasHalfStar && (
          <FaStarHalfAlt
            className={`text-yellow-400 ${sizeClasses[size] || sizeClasses.sm}`}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar
            key={`empty-${i}`}
            className={`text-gray-300 ${sizeClasses[size] || sizeClasses.sm}`}
          />
        ))}
        <span className="ml-2 text-gray-600 font-medium">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Render rating progress bar
  const renderRatingBar = (label, value, color = "blue") => {
    const percentage = (value / 5) * 100;
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
    };

    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">
            {value.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Render mini rating card for display in details section
  const renderRatingCard = () => {
    if (!ratingsData) return null;

    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-sm p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaChartBar className="text-blue-600" />
            Ratings Summary
          </h3>
          <button
            onClick={() => {
              setActiveTab("ratings");
              setShowReviewForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <FaPlus className="text-xs" />
            Add Rating
          </button>
        </div>

        {/* Overall Rating */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-4xl font-bold text-gray-900">
              {ratingsData.averageRating.toFixed(1)}
              <span className="text-xl text-gray-500">/5</span>
            </div>
            <div className="flex items-center mt-1">
              {renderStars(ratingsData.averageRating, "md")}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {ratingsData.totalRatings} total ratings
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {((ratingsData.averageRating / 5) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Individual Ratings */}
        <div className="space-y-3">
          {[
            {
              label: "Display",
              value: ratingsData.display,
              icon: FaExpand,
              color: "text-blue-500",
            },
            {
              label: "Performance",
              value: ratingsData.performance,
              icon: FaBolt,
              color: "text-green-500",
            },
            {
              label: "Camera",
              value: ratingsData.camera,
              icon: FaCamera,
              color: "text-yellow-500",
            },
            {
              label: "Battery",
              value: ratingsData.battery,
              icon: FaBatteryFull,
              color: "text-red-500",
            },
            {
              label: "Design",
              value: ratingsData.design,
              icon: FaMobile,
              color: "text-purple-500",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className={`${item.color} text-sm`} />
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color.replace(
                      "text-",
                      "bg-"
                    )} h-2 rounded-full`}
                    style={{ width: `${(item.value / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-8">
                  {item.value.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-blue-100">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {ratingsData.totalRatings}
              </div>
              <div className="text-xs text-gray-600">Total Ratings</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Math.round((ratingsData.averageRating / 5) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const mobileTabs = [
    { id: "specifications", label: "Specs", icon: FaMicrochip },
    { id: "display", label: "Display", icon: FaExpand },
    { id: "performance", label: "Performance", icon: FaBolt },
    { id: "camera", label: "Camera", icon: FaCamera },
    { id: "battery", label: "Battery", icon: FaBatteryFull },
    { id: "ratings", label: "Ratings", icon: FaStar },
  ];

  const desktopTabs = [
    ...mobileTabs,
    { id: "build_design", label: "Build & Design", icon: FaMobile },
    { id: "connectivity", label: "Connectivity", icon: FaWifi },
    { id: "multimedia", label: "Multimedia", icon: FaFilm },
  ];

  const tabs = window.innerWidth < 768 ? mobileTabs : desktopTabs;

  const renderSpecItems = (data, limit = 5) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const entries = Object.entries(data).filter(
      ([_, value]) => value !== "" && value != null && value !== false
    );

    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const displayEntries = showAllSpecs ? entries : entries.slice(0, limit);

    return (
      <>
        <div className="space-y-3">
          {displayEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-gray-700 font-medium text-sm flex-1 pr-2">
                {toNormalCase(key)}
              </span>
              <span className="text-gray-900 font-semibold text-sm text-right flex-1 break-words">
                {value === true
                  ? "Yes"
                  : value === false
                  ? "No"
                  : value || "Not specified"}
              </span>
            </div>
          ))}
        </div>
        {entries.length > limit && (
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className="w-full mt-4 py-2 text-blue-600 font-medium text-sm flex items-center justify-center gap-1"
          >
            {showAllSpecs ? "Show Less" : `Show ${entries.length - limit} More`}
            <FaChevronDown
              className={`text-xs transition-transform ${
                showAllSpecs ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </>
    );
  };

  const renderTabContent = () => {
    if (!mobileData) return null;

    switch (activeTab) {
      case "specifications":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaMicrochip className="text-blue-500" />
                Key Specifications
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Brand", value: mobileData.brand },
                  { label: "Model", value: mobileData.model },
                  { label: "Category", value: mobileData.category },
                  {
                    label: "Launch Date",
                    value: mobileData.launch_date
                      ? new Date(mobileData.launch_date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : null,
                  },
                  {
                    label: "Rating",
                    value: ratingsData?.averageRating
                      ? `${ratingsData.averageRating.toFixed(1)}/5`
                      : null,
                    icon: FaStar,
                  },
                  {
                    label: "Processor",
                    value: mobileData.performance?.processor,
                  },
                  { label: "RAM", value: mobileData.performance?.ram },
                  {
                    label: "Storage",
                    value: mobileData.performance?.ROM_storage,
                  },
                  { label: "Display Size", value: mobileData.display?.size },
                  {
                    label: "Battery",
                    value: mobileData.battery?.battery_capacity_mah,
                  },
                  {
                    label: "OS",
                    value: mobileData.performance?.operating_system,
                  },
                ].map(
                  (item, index) =>
                    item.value && (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-100"
                      >
                        <span className="text-gray-700 font-medium text-sm flex items-center gap-2">
                          {item.icon && (
                            <item.icon className="text-yellow-400 text-xs" />
                          )}
                          {item.label}
                        </span>
                        <span className="text-gray-900 font-semibold text-sm text-right">
                          {item.value}
                        </span>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>
        );

      case "display":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaExpand className="text-green-500" />
              Display
            </h3>
            {renderSpecItems(mobileData.display)}
          </div>
        );

      case "performance":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBolt className="text-yellow-500" />
              Performance
            </h3>
            {renderSpecItems(mobileData.performance)}
          </div>
        );

      case "camera":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCamera className="text-purple-500" />
              Camera
            </h3>
            {renderSpecItems(mobileData.camera)}
          </div>
        );

      case "battery":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBatteryFull className="text-red-500" />
              Battery
            </h3>
            {renderSpecItems(mobileData.battery)}
          </div>
        );

      case "build_design":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaMobile className="text-indigo-500" />
              Build & Design
            </h3>
            {renderSpecItems(mobileData.build_design)}
          </div>
        );

      case "connectivity":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaWifi className="text-blue-500" />
              Connectivity
            </h3>
            {renderSpecItems(mobileData.connectivity_network)}
            {mobileData.ports && (
              <>
                <h4 className="text-md font-semibold text-gray-900 mt-6 mb-3">
                  Ports
                </h4>
                {renderSpecItems(mobileData.ports)}
              </>
            )}
          </div>
        );

      case "multimedia":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFilm className="text-purple-500" />
              Multimedia
            </h3>
            {renderSpecItems(mobileData.audio)}
            {mobileData.multimedia && (
              <>
                <h4 className="text-md font-semibold text-gray-900 mt-6 mb-3">
                  Media Formats
                </h4>
                {renderSpecItems(mobileData.multimedia)}
              </>
            )}
          </div>
        );

      case "ratings":
        return (
          <div className="space-y-6">
            {/* Ratings Summary Card */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  User Ratings & Reviews
                </h3>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  <FaPlus />
                  Add Your Review
                </button>
              </div>

              {/* Overall Rating Expanded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    {ratingsData?.averageRating?.toFixed(1) || "0.0"}
                    <span className="text-2xl text-gray-500">/5</span>
                  </div>
                  <div className="flex justify-center mb-4">
                    {renderStars(ratingsData?.averageRating || 0, "xl")}
                  </div>
                  <div className="text-gray-600">
                    Based on {ratingsData?.totalRatings || 0} ratings
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    {ratingsData?.averageRating >= 4
                      ? "Excellent"
                      : ratingsData?.averageRating >= 3
                      ? "Good"
                      : ratingsData?.averageRating >= 2
                      ? "Average"
                      : "Below Average"}
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-6 text-lg">
                    Rating Breakdown
                  </h4>
                  {[
                    {
                      label: "Display",
                      value: ratingsData?.display || 0,
                      color: "blue",
                    },
                    {
                      label: "Performance",
                      value: ratingsData?.performance || 0,
                      color: "green",
                    },
                    {
                      label: "Camera",
                      value: ratingsData?.camera || 0,
                      color: "yellow",
                    },
                    {
                      label: "Battery",
                      value: ratingsData?.battery || 0,
                      color: "red",
                    },
                    {
                      label: "Design",
                      value: ratingsData?.design || 0,
                      color: "purple",
                    },
                  ].map((item) => (
                    <div key={item.label} className="mb-5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {item.value.toFixed(1)}
                          </span>
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span className="text-sm text-gray-500">/5</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`bg-${item.color}-500 h-2.5 rounded-full`}
                          style={{ width: `${(item.value / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-300">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingReview ? "Edit Your Review" : "Write a Review"}
                  </h4>
                  <div className="space-y-4">
                    {/* Overall Rating */}

                    {/* Category Ratings */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: "Display", category: "display" },
                        { label: "Performance", category: "performance" },
                        { label: "Camera", category: "camera" },
                        { label: "Battery", category: "battery" },
                        { label: "Design", category: "design" },
                      ].map((item) => (
                        <div key={item.category}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {item.label}
                          </label>
                          <InlineRatingInput
                            value={
                              editingReview?.[item.category] ||
                              newReview[item.category]
                            }
                            onChange={(value) =>
                              handleRatingChange(item.category, value)
                            }
                            size="md"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overall Rating
                      </label>
                      <div className="flex items-center gap-4">
                        <InlineRatingInput
                          value={editingReview?.rating || newReview.rating}
                          onChange={(value) =>
                            handleRatingChange("rating", value)
                          }
                          size="lg"
                        />
                        <span className="text-lg font-semibold text-gray-700">
                          {(editingReview?.rating || newReview.rating).toFixed(
                            1
                          )}
                          /5
                        </span>
                      </div>
                    </div>

                    {/* Title and detailed review removed — only numeric ratings are captured */}

                    <div className="flex gap-3">
                      <button
                        onClick={submitReview}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        {editingReview ? "Update Rating" : "Submit Rating"}
                      </button>
                      <button
                        onClick={() => {
                          setShowReviewForm(false);
                          setEditingReview(null);
                          setNewReview({
                            rating: 0,
                            display: 0,
                            performance: 0,
                            camera: 0,
                            battery: 0,
                            design: 0,
                          });
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews list removed — ratings-only UI */}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="text-center py-8 text-gray-500">
              No data available for this section
            </div>
          </div>
        );
    }
  };

  if (loading || selectedDevice === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-2xl  px-8 py-6 shadow-xl">
          <Spinner
            size={40}
            className="border-4 border-violet-500 border-t-blue-500"
          />

          <p
            className="text-lg font-medium font-bold text-white
           tracking-wide"
          >
            Please Wait.....
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !mobileData) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Device Not Found
          </h3>
          <p className="text-gray-600 text-sm">
            The requested mobile device could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Share Device
              </h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={shareToWhatsApp}
                className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium"
              >
                <FaWhatsapp className="text-xl" />
                Share on WhatsApp
              </button>
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium"
              >
                <FaFacebook className="text-xl" />
                Share on Facebook
              </button>
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-400 font-medium"
              >
                <FaTwitter className="text-xl" />
                Share on Twitter
              </button>
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
              >
                <FaEnvelope className="text-xl" />
                Share via Email
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
              >
                <FaLink className="text-xl" />
                Copy Link
              </button>
            </div>
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white overflow-hidden">
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {mobileData.name}
              </h1>
              <p className="text-gray-600 text-sm">
                {mobileData.brand} • {mobileData.model}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaHeart
                  className={`text-lg ${
                    isFavorite ? "text-red-500 fill-current" : "text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaShareAlt className="text-lg text-gray-600" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
              <FaStar className="text-yellow-400 text-sm" />
              <span className="font-bold text-blue-900 text-sm">
                {ratingsData?.averageRating?.toFixed(1) || "N/A"}
              </span>
            </div>
            {currentVariant && (
              <span className="text-2xl font-bold text-green-600">
                ₹{formatPrice(currentVariant.base_price)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Images Section */}
          <div className="lg:w-2/5 p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Main Image */}
            <div className="rounded-lg p-6 mb-4 relative">
              <img
                src={
                  mobileData.images?.[activeImage] || "/placeholder-image.jpg"
                }
                alt={mobileData.name}
                className="w-full h-48 object-contain"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
              {/* Action buttons on image */}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button
                  onClick={toggleFavorite}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                >
                  <FaHeart
                    className={`${
                      isFavorite ? "text-red-500 fill-current" : "text-gray-600"
                    }`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                >
                  <FaShare className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {mobileData.images && mobileData.images.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                {mobileData.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg p-1 border-2 transition-all duration-200 ${
                      activeImage === index
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${mobileData.name} view ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* color section */}
            {(mobileData?.colors?.length > 0 ||
              (variants && variants.length > 0)) && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Available Colors
                </h4>
                <div className="flex gap-2 items-center">
                  {(mobileData?.colors?.length > 0
                    ? mobileData.colors
                    : variants.map((v) => ({
                        name: v.color_name || v.color || "",
                        code: v.color_code || v.colorCode || "#ccc",
                      }))
                  ).map((color, idx) => (
                    <button
                      key={`${color.code}-${color.name}-${idx}`}
                      type="button"
                      title={color.name || color.code}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${"border-gray-200 hover:border-gray-300"}`}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color.code || "#ccc" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variant selection */}
            {variants && variants.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Available Variants
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((variant, index) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(index)}
                      className={`p-3 rounded-lg border-2 transition-all duration-150 ${
                        selectedVariant === index
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        <FaMemory className="text-gray-600 text-lg center" />
                        {variant.ram} / {variant.storage}
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        ₹{formatPrice(variant.base_price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Share and Copy Link Buttons - Mobile */}
            <div className="lg:hidden flex gap-2 mb-4">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                {copied ? (
                  <>
                    <FaCheck className="text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <FaCopy className="text-gray-600" />
                    <span className="text-gray-700">Copy Link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium"
              >
                <FaShareAlt />
                <span>Share</span>
              </button>
            </div>

            {/* Quick Specs - Mobile Only */}
            <div className="lg:hidden grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <FaMicrochip className="text-blue-600 text-lg mx-auto mb-1" />
                <div className="font-bold text-blue-900 text-sm">
                  {mobileData.performance?.processor?.split(" ")[0] || "-"}
                </div>
                <div className="text-xs text-blue-700">Processor</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <FaCamera className="text-green-600 text-lg mx-auto mb-1" />
                <div className="font-bold text-green-900 text-sm">
                  {mobileData.camera?.main_camera_megapixels || "-"}
                </div>
                <div className="text-xs text-green-700">Main Camera</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <FaBatteryFull className="text-purple-600 text-lg mx-auto mb-1" />
                <div className="font-bold text-purple-900 text-sm">
                  {mobileData.battery?.battery_capacity_mah || "-"}
                </div>
                <div className="text-xs text-purple-700">Battery</div>
              </div>
            </div>
          </div>

          {/* Details Section - Right Side */}
          <div className="lg:w-3/5 p-4">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {mobileData.name}
                  </h1>
                  <p className="text-gray-600 mb-3">
                    {mobileData.brand} • {mobileData.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Add to favorites"
                  >
                    <FaHeart
                      className={`text-xl ${
                        isFavorite
                          ? "text-red-500 fill-current"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Share"
                  >
                    <FaShareAlt className="text-xl text-gray-600" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-full hover:bg-gray-100 relative"
                    title="Copy link"
                  >
                    {copied && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                        Link copied!
                      </div>
                    )}
                    {copied ? (
                      <FaCheck className="text-xl text-green-600" />
                    ) : (
                      <FaCopy className="text-xl text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                {ratingsData?.averageRating && (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                    {renderStars(ratingsData.averageRating)}
                    <span className="text-blue-700 text-sm">
                      ({ratingsData.totalRatings || 0} ratings)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mb-6">
                {currentVariant && (
                  <>
                    <span className="text-3xl font-bold text-green-600">
                      ₹ {formatPrice(currentVariant.base_price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({currentVariant.ram} / {currentVariant.storage} )
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ratings Card removed from details column — rendered below tabs */}

            {/* Store Prices Section */}
            {sortedStores.length > 0 && (
              <div className="mb-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaStore className="text-blue-500" />
                    Available at
                  </h3>
                  {sortedStores.length > 3 && (
                    <button
                      onClick={() => setShowAllStores(!showAllStores)}
                      className="text-blue-600 text-sm font-medium flex items-center gap-1"
                    >
                      {showAllStores ? "Show Less" : "View All"}
                      <FaChevronDown
                        className={`text-xs transition-transform ${
                          showAllStores ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {displayedStores.map((store, index) => {
                    const isActive = String(store.id) === String(activeStoreId);
                    return (
                      <div
                        key={store.id || index}
                        className={`bg-white border rounded-xl p-3 transition-all duration-200 ${
                          isActive
                            ? "border-blue-400 shadow-md bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {/* Store Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center p-2 shadow-sm">
                              <img
                                src={getStoreLogo(store.store_name)}
                                alt={store.store_name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.src = STORE_LOGOS.default;
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-md capitalize">
                                {store.store_name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {store.variantRam} / {store.variantStorage} •
                              </p>
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-md font-bold text-green-600">
                                ₹ {formatPrice(store.price)}
                              </div>
                            </div>
                            <a
                              href={store.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200 hover:shadow-lg"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                              Buy Now
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop Quick Specs */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <FaMicrochip className="text-blue-600 text-xl mx-auto mb-2" />
                <div className="font-bold text-blue-900">
                  {mobileData.performance?.processor || "-"}
                </div>
                <div className="text-sm text-blue-700">Processor</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <FaCamera className="text-green-600 text-xl mx-auto mb-2" />
                <div className="font-bold text-green-900">
                  {mobileData.camera?.main_camera_megapixels || "-"}
                </div>
                <div className="text-sm text-green-700">Main Camera</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <FaBatteryFull className="text-purple-600 text-xl mx-auto mb-2" />
                <div className="font-bold text-purple-900">
                  {mobileData.battery?.battery_capacity_mah || "-"}
                </div>
                <div className="text-sm text-purple-700">Battery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t border-gray-200">
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-200 flex-shrink-0 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <IconComponent className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">{renderTabContent()}</div>
        </div>
        {/* Render Ratings Summary below tabbed details */}
        <div className="max-w-7xl mx-auto p-4">
          {ratingsData && <div className="mb-6">{renderRatingCard()}</div>}
        </div>
      </div>
    </div>
  );
};

export default MobileDetailCard;
