// src/components/BestPriceSection.jsx
import React from "react";
import {
  FaWallet,
  FaGem,
  FaCrown,
  FaTrophy,
  FaGamepad,
  FaMobileAlt,
  FaChartLine,
  FaRocket,
  FaTags,
  FaArrowRight,
} from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../../hooks/useDevice";

const BestPriceSection = () => {
  const [activeBudget, setActiveBudget] = useState();
  const navigate = useNavigate();
  const deviceContext = useDevice();
  const { setFilters } = deviceContext || {};

  const handleCardClick = (card) => {
    setActiveBudget(card.id);

    const max =
      parseInt(String(card.price || "").replace(/[^0-9]/g, ""), 10) || 0;

    // Build filter object; set numeric price max and detect keywords
    const newFilters = {
      brand: [],
      priceRange: { min: 0, max },
      ram: [],
      storage: [],
      battery: [],
      processor: [],
      network: [],
      refreshRate: [],
      camera: [],
    };

    const title = (card.title || "").toLowerCase();
    // 5G keyword
    if (/5g/.test(title) || /5 g/.test(title)) newFilters.network = ["5G"];

    // RAM keyword like '8GB' or '12GB'
    const ramMatch = title.match(/(\d+)\s*gb/);
    if (ramMatch) newFilters.ram = [`${ramMatch[1]}GB`];

    // Gaming -> prefer higher refresh rates and common gaming chips
    if (/game|gaming/.test(title)) {
      newFilters.refreshRate = ["90Hz", "120Hz", "144Hz"];
      // prefer Snapdragon/MediaTek devices for performance
      newFilters.processor = ["Snapdragon", "MediaTek"];
    }

    // Flagship / premium -> broaden to high-end processors
    if (/flagship|premium|high-end/.test(title)) {
      newFilters.processor = [
        "Snapdragon",
        "Apple",
        "Exynos",
        "Kirin",
        "MediaTek",
      ];
    }

    try {
      setFilters?.(newFilters);
    } catch {
      // ignore
    }

    // Build query params so the results are shareable and the list
    // initializes from URL. Use simple param names: priceMin, priceMax,
    // ram, network, processor, refreshRate (comma-separated for lists).
    const params = new URLSearchParams();
    params.set("priceMin", String(newFilters.priceRange.min || 0));
    params.set("priceMax", String(newFilters.priceRange.max || 0));
    if (newFilters.network && newFilters.network.length)
      params.set("network", newFilters.network.join(","));
    if (newFilters.ram && newFilters.ram.length)
      params.set("ram", newFilters.ram.join(","));
    if (newFilters.processor && newFilters.processor.length)
      params.set("processor", newFilters.processor.join(","));
    if (newFilters.refreshRate && newFilters.refreshRate.length)
      params.set("refreshRate", newFilters.refreshRate.join(","));

    navigate(`/devicelist/smartphones?${params.toString()}`);
  };

  const budgetCards = [
    {
      id: "10k",
      title: "Under ₹10,000",
      price: "₹10,000",
      icon: <FaWallet />,
      color: "from-green-500 to-emerald-600",
      description: "Best budget phones",
    },
    {
      id: "20k",
      title: "5G Under ₹20,000",
      price: "₹20,000",
      icon: <FaGem />,
      color: "from-purple-500 to-indigo-600",
      description: "Affordable 5G phones",
    },
    {
      id: "30k",
      title: "Under ₹30,000",
      price: "₹30,000",
      icon: <FaTrophy />,
      color: "from-yellow-500 to-amber-600",
      description: "Mid-range performers",
    },
    {
      id: "60k",
      title: "Flagship Under ₹60,000",
      price: "₹60,000",
      icon: <FaCrown />,
      color: "from-pink-500 to-rose-600",
      description: "Premium devices",
    },
    {
      id: "gaming30k",
      title: "Gaming Under ₹30,000",
      price: "₹30,000",
      icon: <FaGamepad />,
      color: "from-red-500 to-orange-600",
      description: "Gaming smartphones",
    },
    {
      id: "50k",
      title: "Under ₹50,000",
      price: "₹50,000",
      icon: <FaMobileAlt />,
      color: "from-blue-500 to-cyan-600",
      description: "High-end phones",
    },
    {
      id: "8gb25k",
      title: "8GB RAM Under ₹25,000",
      price: "₹25,000",
      icon: <FaChartLine />,
      color: "from-indigo-500 to-purple-600",
      description: "Performance focused",
    },
    {
      id: "12gb40k",
      title: "12GB RAM Under ₹40,000",
      price: "₹40,000",
      icon: <FaRocket />,
      color: "from-teal-500 to-green-600",
      description: "Powerful multitasking",
    },
  ];

  return (
    <section className="my-8 mx-3 sm:mx-4 lg:mx-auto max-w-7xl">
      {/* Section Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-full mb-3">
          <FaTags className="text-white text-xs" />
          <span className="text-white text-xs font-bold">BEST DEALS</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Find Your Perfect Phone
        </h2>
        <p className="text-gray-600 text-sm">Curated picks for every budget</p>
      </div>

      {/* Budget Cards Grid - Simple 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {budgetCards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card)}
            className={`text-left p-3 rounded-lg border transition-all duration-200 ${
              activeBudget === card.id
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-2`}
            >
              <span className="text-white text-sm">{card.icon}</span>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight mb-1">
              {card.title}
            </h3>
            <p className="text-green-600 font-bold text-sm mb-1">
              {card.price}
            </p>
            <p className="text-gray-500 text-xs">{card.description}</p>
          </button>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => navigate("/devicelist/smartphones")}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          View All Smartphones
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </section>
  );
};

export default BestPriceSection;
