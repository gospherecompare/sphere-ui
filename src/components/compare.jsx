// src/components/MobileCompare.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Cpu,
  Camera,
  Battery,
  Wifi,
  Music,
  Smartphone,
  Monitor,
  MemoryStick,
  Zap,
  Radio,
  Headphones,
  ChevronRight,
  Plus,
  Trash2,
  BarChart3,
  Star,
  ChevronLeft,
  ChevronRight as RightArrow,
  Smartphone as PhoneIcon,
  Sparkles,
  Filter,
  Share2,
  AlertCircle,
  Package,
  HardDrive,
  DollarSign,
  Info,
} from "lucide-react";
import "../styles/hideScrollbar.css";
import useDevice from "../hooks/useDevice";
import useTitle from "../hooks/useTitle";
import { useLocation, useNavigate } from "react-router-dom";

const SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: Smartphone,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "display",
    label: "Display",
    icon: Monitor,
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "camera",
    label: "Camera",
    icon: Camera,
    color: "pink",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "performance",
    label: "Performance",
    icon: Cpu,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "battery",
    label: "Battery",
    icon: Battery,
    color: "amber",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "network",
    label: "Network",
    icon: Wifi,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    id: "audio",
    label: "Audio",
    icon: Headphones,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-400",
  },
  {
    id: "features",
    label: "Features",
    icon: Zap,
    color: "orange",
    gradient: "from-orange-500 to-red-500",
  },
];

const MAX_DEVICES = 4;
const MIN_DEVICES = 2;

const MobileCompare = () => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [variantSelection, setVariantSelection] = useState({});
  const [activeSection, setActiveSection] = useState("overview");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [tableHeight, setTableHeight] = useState("auto");
  const [sharedDescription, setSharedDescription] = useState("");

  const tableContainerRef = useRef(null);
  const { smartphone: availableDevices = [], loading } = useDevice();
  const location = useLocation();
  const navigate = useNavigate();

  // Build a list of candidate items: one entry per variant. Each item has { base, variantIndex, variant }
  const filteredDevices = useMemo(() => {
    const candidates = (availableDevices || []).flatMap((device) => {
      const vars =
        Array.isArray(device.variants) && device.variants.length
          ? device.variants
          : [null];
      return vars.map((v, vi) => ({
        base: device,
        variant: v,
        variantIndex: vi,
      }));
    });

    // remove already selected composite ids
    const notSelected = candidates.filter(
      (it) =>
        !selectedDevices.some(
          (sd) => String(sd.id) === `${it.base.id}-${it.variantIndex}`
        )
    );

    if (!searchQuery.trim()) return notSelected.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return notSelected
      .filter(
        (it) =>
          (it.base.name || "").toLowerCase().includes(query) ||
          (it.base.brand || "").toLowerCase().includes(query) ||
          (it.base.model || "").toLowerCase().includes(query)
      )
      .slice(0, 20);
  }, [availableDevices, searchQuery, selectedDevices]);

  // Get device specs
  // Format price (hoisted so it can be used by other functions)
  function formatPrice(price) {
    if (!price || price === 0) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  // Get device specs
  const getDeviceSpecs = (device, section) => {
    if (section === "overview") {
      const selectedVariant = getSelectedVariant(device);
      return {
        rating: device.rating,
        price: formatPrice(selectedVariant?.base_price || device.price || 0),
        variant: `${selectedVariant?.ram || "N/A"} / ${
          selectedVariant?.storage || "N/A"
        }`,
        os: device.performance?.os || device.os || "N/A",
        processor: device.performance?.processor || "N/A",
        launch_date: device.launch_date
          ? new Date(device.launch_date).toLocaleDateString()
          : "N/A",
      };
    }
    return device[section] || {};
  };

  // Get selected variant for a device
  const getSelectedVariant = (device) => {
    const variantIndex = variantSelection[device.id] || 0;
    if (Array.isArray(device.variants) && device.variants.length > 0) {
      return device.variants[variantIndex] || device.variants[0];
    }
    return null;
  };

  // Get all spec keys for current section
  const getSectionSpecs = useMemo(() => {
    if (selectedDevices.length === 0) return [];

    const specKeys = new Set();
    selectedDevices.forEach((device) => {
      const specs = getDeviceSpecs(device, activeSection);
      Object.keys(specs).forEach((key) => {
        if (specs[key] && specs[key] !== "N/A") {
          specKeys.add(key);
        }
      });
    });

    // Sort keys with custom order
    const sortedKeys = Array.from(specKeys).sort((a, b) => {
      const order = [
        "rating",
        "price",
        "variant",
        "processor",
        "os",
        "launch_date",
      ];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedKeys;
  }, [selectedDevices, activeSection]);

  const makeSelectedEntry = (base, variantIndex = 0) => {
    const id = `${base.id}-${variantIndex}`;
    return { ...base, id, baseId: base.id, selectedVariantIndex: variantIndex };
  };

  // Add device (base device + variantIndex)
  const addDevice = (baseDevice, variantIndex = 0) => {
    if (selectedDevices.length >= MAX_DEVICES) {
      alert(`Maximum ${MAX_DEVICES} devices can be compared`);
      return;
    }
    const entryId = `${baseDevice.id}-${variantIndex}`;
    if (selectedDevices.some((s) => String(s.id) === entryId)) return;

    const entry = makeSelectedEntry(baseDevice, variantIndex);
    setSelectedDevices((prev) => [...prev, entry]);
    setVariantSelection((vs) => ({ ...vs, [entry.id]: variantIndex }));
    setShowSearch(false);
    setSearchQuery("");
  };

  // Auto-add device from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      // Support single `add` param OR a comma-separated `devices` param.
      const toAdd = params.get("add");
      const devicesParam = params.get("devices");

      if (toAdd) {
        const found = (availableDevices || []).find(
          (d) =>
            String(d.id) === String(toAdd) || String(d.model) === String(toAdd)
        );
        if (found) {
          const entry = makeSelectedEntry(found, 0);
          setSelectedDevices((prev) => {
            if (prev.some((p) => String(p.id) === String(entry.id)))
              return prev;
            return [...prev, entry];
          });
          setVariantSelection((vs) => ({ ...vs, [entry.id]: 0 }));
        }
      }

      if (devicesParam) {
        // devices param format: comma-separated entries like "<baseId>:<variantIndex>" or just ids/models
        const parts = devicesParam
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        parts.forEach((part) => {
          const [idOrModel, variantIdxRaw] = part.split(":");
          const variantIdx = variantIdxRaw ? parseInt(variantIdxRaw, 10) : 0;
          const found = (availableDevices || []).find(
            (d) =>
              String(d.id) === String(idOrModel) ||
              String(d.model) === String(idOrModel)
          );
          if (found) {
            const entry = makeSelectedEntry(found, variantIdx || 0);
            setSelectedDevices((prev) => {
              if (prev.some((p) => String(p.id) === String(entry.id)))
                return prev;
              return [...prev, entry];
            });
            setVariantSelection((vs) => ({
              ...vs,
              [entry.id]: variantIdx || 0,
            }));
          }
        });
      }

      // remove params from URL after handling so they don't re-trigger
      const descParam = params.get("desc");
      if (descParam) setSharedDescription(String(descParam));

      if (toAdd || devicesParam) navigate(location.pathname, { replace: true });
    } catch (err) {
      // ignore
    }
  }, [location.search, availableDevices, navigate, location.pathname]);

  // Sync variant selection
  useEffect(() => {
    setVariantSelection((prev) => {
      const next = { ...prev };
      selectedDevices.forEach((d) => {
        if (next[d.id] === undefined) next[d.id] = 0;
      });
      Object.keys(next).forEach((k) => {
        if (!selectedDevices.some((d) => String(d.id) === String(k))) {
          delete next[k];
        }
      });
      return next;
    });
  }, [selectedDevices]);

  // Remove device
  const removeDevice = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.filter((d) => String(d.id) !== String(deviceId))
    );
  };

  // (formatPrice hoisted above)

  // Get device image
  const getPrimaryImage = (device) => {
    if (!device) return "";
    if (device.image) return device.image;
    if (Array.isArray(device.images) && device.images.length)
      return device.images[0];
    return "";
  };

  // Start comparison
  const startComparison = () => {
    if (selectedDevices.length < MIN_DEVICES) {
      alert(`Please select at least ${MIN_DEVICES} devices to compare`);
      return;
    }
    setIsComparing(true);
    setTimeout(() => {
      document.getElementById("comparison-section")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  // Clear all
  const clearAll = () => {
    setSelectedDevices([]);
    setIsComparing(false);
    setTableHeight("auto");
  };

  // Scroll table horizontally
  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      const scrollAmount = 300;
      tableContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Share comparison
  const shareComparison = () => {
    if (!selectedDevices || selectedDevices.length === 0) {
      alert("No devices selected to share");
      return;
    }

    // Build devices param as baseId:variantIndex entries
    const devicesParam = selectedDevices
      .map(
        (d) =>
          `${d.baseId ?? d.id}:${
            d.selectedVariantIndex ?? variantSelection[d.id] ?? 0
          }`
      )
      .join(",");

    // Build a human-friendly description from content (overview processor + price), truncated
    const overviewDesc = selectedDevices
      .map((d) => {
        try {
          const specs = getDeviceSpecs(d, "overview");
          return `${d.name} - ${specs.processor || ""} - ${
            specs.price || ""
          }`.trim();
        } catch {
          return d.name;
        }
      })
      .join(" | ");
    const desc =
      overviewDesc.length > 240
        ? overviewDesc.slice(0, 237) + "..."
        : overviewDesc;

    const params = new URLSearchParams();
    params.set("devices", devicesParam);
    if (desc) params.set("desc", desc);

    const shareUrl = `${location.pathname}?${params.toString()}`;

    if (navigator.share) {
      navigator.share({
        title: "Device Comparison",
        text: desc ? `Compare: ${desc}` : "Compare these devices",
        url: window.location.origin + shareUrl,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + shareUrl);
      alert("Comparison link copied to clipboard!");
    }
  };

  // Update table height based on content
  useEffect(() => {
    if (isComparing && tableContainerRef.current) {
      const updateHeight = () => {
        const contentHeight = tableContainerRef.current.scrollHeight;
        setTableHeight(`${contentHeight}px`);
      };

      updateHeight();
      const timer = setTimeout(updateHeight, 100);
      return () => clearTimeout(timer);
    }
  }, [isComparing, selectedDevices, activeSection, getSectionSpecs]);

  // Update document title
  const selectedNames = selectedDevices.map((d) => d.name).filter(Boolean);
  useTitle({
    page: "Compare",
    name: selectedNames.length > 0 ? selectedNames.join(" vs ") : undefined,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Floating Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Compare</h1>
                <p className="text-xs text-gray-500">
                  {selectedDevices.length} device
                  {selectedDevices.length !== 1 ? "s" : ""} selected
                </p>
                {sharedDescription ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {sharedDescription}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedDevices.length > 0 && (
                <>
                  <button
                    onClick={shareComparison}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Share comparison"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Smartphone Comparison
          </h1>
          <p className="text-gray-600 mb-4">
            Compare up to {MAX_DEVICES} devices side by side
          </p>

          {selectedDevices.length === 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  How to Compare
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700">Add 2-4 devices</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700">Select categories</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700">Compare & decide</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Devices Section - COMPACT LAYOUT */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Selected Devices
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedDevices.length}/{MAX_DEVICES})
                </span>
              </h2>
              {selectedDevices.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Tap on a device to remove it
                </p>
              )}
            </div>

            {selectedDevices.length > 0 && (
              <button
                onClick={() => setShowTips(!showTips)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <AlertCircle className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Tips Card */}
          {showTips && selectedDevices.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">
                    Comparison Tips
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Swipe horizontally to see all devices</li>
                    <li>• Tap variant dropdown to change RAM/Storage</li>
                    <li>• Ratings and prices update with variant selection</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Devices Grid - ULTRA COMPACT LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedDevices.map((device, index) => {
              const selectedVariant = getSelectedVariant(device);
              return (
                <div
                  key={device.id}
                  onClick={() => removeDevice(device.id)}
                  className="group relative bg-white rounded-xl border border-gray-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Remove Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 to-red-100/90 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                    <div className="transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                      <Trash2 className="h-6 w-6 text-red-600 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-red-700 block">
                        Remove
                      </span>
                    </div>
                  </div>

                  {/* Device Card - ULTRA COMPACT */}
                  <div className="p-3 relative z-0">
                    <div className="flex flex-row items-start gap-3">
                      {/* Device Image - SMALLER & FITTED */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-1 border border-gray-200">
                          <img
                            src={getPrimaryImage(device) || null}
                            alt={device.name}
                            className="w-full h-full object-contain object-center"
                            onError={(e) => {
                              e.target.src = `/api/placeholder/56/56?text=${device.brand?.charAt(
                                0
                              )}`;
                            }}
                          />
                        </div>
                      </div>

                      {/* Device Info - TIGHTER SPACING */}
                      <div className="flex-1 min-w-0">
                        {/* Rank Badge - SMALLER */}
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                          {index + 1}
                        </div>

                        {/* Brand & Name - COMPACT */}
                        <div className="mb-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {device.brand}
                            </span>
                            {device.rating && (
                              <div className="flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 text-yellow-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {device.rating}
                                </span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 leading-tight">
                            {device.name}
                          </h3>
                        </div>

                        {/* Variant Info - COMPACT */}
                        {selectedVariant && (
                          <div className="mb-1">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Package className="h-2.5 w-2.5 flex-shrink-0" />
                              <span className="font-medium truncate text-xs">
                                {selectedVariant.ram} /{" "}
                                {selectedVariant.storage}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Price - COMPACT */}
                        <div className="text-base font-bold text-gray-900 mb-1">
                          {selectedVariant
                            ? formatPrice(selectedVariant.base_price)
                            : formatPrice(device.price || 0)}
                        </div>

                        {/* Variant Selector - COMPACT */}
                        {Array.isArray(device.variants) &&
                          device.variants.length > 1 && (
                            <div className="mt-1">
                              <select
                                value={variantSelection[device.id] ?? 0}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const idx = Number(e.target.value);
                                  setVariantSelection((prev) => ({
                                    ...prev,
                                    [device.id]: idx,
                                  }));
                                }}
                                className="w-full text-xs px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                {device.variants.map((v, vi) => (
                                  <option
                                    key={vi}
                                    value={vi}
                                    className="text-xs"
                                  >
                                    {`${v.ram || "N/A"} / ${
                                      v.storage || "N/A"
                                    } • ${formatPrice(v.base_price || 0)}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Device Button - COMPACT */}
            {selectedDevices.length < MAX_DEVICES && (
              <button
                onClick={() => setShowSearch(true)}
                className="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex flex-col items-center justify-center p-4 min-h-[110px] group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-gray-700 text-sm mb-0.5">
                  Add Device
                </span>
                <span className="text-xs text-gray-500">
                  {MAX_DEVICES - selectedDevices.length} left
                </span>
              </button>
            )}
          </div>

          {/* Compare Button */}
          {selectedDevices.length >= MIN_DEVICES && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={startComparison}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {isComparing ? "Update Comparison" : "Start Comparing"}
                <ChevronRight className="h-3 w-3" />
              </button>

              {isComparing && (
                <button
                  onClick={() => setActiveSection("overview")}
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all duration-200 flex items-center gap-2"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16 sm:p-6">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Add Devices
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Select devices to compare
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by brand, model, or feature..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto">
                {filteredDevices.length === 0 ? (
                  <div className="p-12 text-center">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No devices found
                    </h4>
                    <p className="text-gray-500">
                      Try different keywords or browse all devices
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                    {filteredDevices.map((it) => {
                      const base = it.base;
                      const variant = it.variant;
                      const vi = it.variantIndex ?? 0;
                      const key = `${base.id}-${vi}`;
                      const displayVariant =
                        variant || (base.variants && base.variants[vi]) || null;
                      return (
                        <button
                          key={key}
                          onClick={() => addDevice(base, vi)}
                          className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                              <img
                                src={getPrimaryImage(base) || null}
                                alt={base.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="mb-1">
                                <div className="text-sm font-semibold text-blue-600 mb-1">
                                  {base.brand}
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">
                                  {base.name}
                                </h4>
                              </div>

                              {/* Rating */}
                              {base.rating && (
                                <div className="flex items-center gap-1 mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i <
                                          Math.floor(Number(base.rating) || 0)
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {base.rating}
                                  </span>
                                </div>
                              )}

                              {/* Variant & Price */}
                              <div className="flex items-center justify-between">
                                {displayVariant && (
                                  <div className="text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <span>{displayVariant.ram || "N/A"}</span>
                                      <span>/</span>
                                      <span>
                                        {displayVariant.storage || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div className="text-sm font-bold text-gray-900">
                                  {displayVariant
                                    ? formatPrice(displayVariant.base_price)
                                    : formatPrice(base.price || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      {filteredDevices.length} devices
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">
                        {MAX_DEVICES - selectedDevices.length} slots available
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Section */}
        {isComparing && selectedDevices.length >= MIN_DEVICES && (
          <div
            id="comparison-section"
            className="space-y-6 animate-in fade-in duration-500"
          >
            {/* Section Navigation */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Detailed Comparison
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {getSectionSpecs.length} specifications in{" "}
                      {SECTIONS.find((s) => s.id === activeSection)?.label}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedDevices.length} devices
                  </div>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex overflow-x-auto no-scrollbar px-2 py-2">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 whitespace-nowrap transition-all duration-200 flex-shrink-0 mr-2 last:mr-0 rounded-lg ${
                        isActive
                          ? `bg-gradient-to-r ${section.gradient} text-white shadow-md`
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scroll Controls */}
            {selectedDevices.length > 2 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <button
                  onClick={() => scrollTable("left")}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Swipe to view all columns
                  </p>
                  <p className="text-xs text-gray-500">
                    Use arrows or swipe horizontally
                  </p>
                </div>
                <button
                  onClick={() => scrollTable("right")}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RightArrow className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            )}

            {/* Comparison Table - COMPACT HEIGHT */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div
                ref={tableContainerRef}
                className="overflow-x-auto no-scrollbar"
              >
                <div className="min-w-[700px]" style={{ minHeight: "auto" }}>
                  {/* Table Header - COMPACT */}
                  <div className="border-b border-gray-200">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `200px repeat(${selectedDevices.length}, minmax(150px, 1fr))`,
                      }}
                    >
                      {/* Sticky Specification Header - COMPACT */}
                      <div className="p-4 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white sticky left-0 z-20">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md">
                            <BarChart3 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">
                              Specifications
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Device Headers - COMPACT */}
                      {selectedDevices.map((device, index) => {
                        const selectedVariant = getSelectedVariant(device);
                        return (
                          <div
                            key={device.id}
                            className="p-3 border-r border-gray-200 last:border-r-0 bg-gradient-to-b from-gray-50 to-white"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-1 border border-gray-200 shadow-sm">
                                <img
                                  src={getPrimaryImage(device) || null}
                                  alt={device.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="mb-1">
                                  <div className="text-xs font-semibold text-blue-600 truncate">
                                    {device.brand}
                                  </div>
                                  <h3 className="font-bold text-gray-900 text-xs truncate">
                                    {device.name}
                                  </h3>
                                </div>

                                {/* Rating - COMPACT */}
                                {device.rating && (
                                  <div className="flex items-center gap-0.5 mb-0.5">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-2 w-2 ${
                                            i <
                                            Math.floor(
                                              Number(device.rating) || 0
                                            )
                                              ? "text-yellow-500 fill-yellow-500"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">
                                      {device.rating}
                                    </span>
                                  </div>
                                )}

                                {/* Variant - COMPACT */}
                                {selectedVariant && (
                                  <div className="text-xs text-gray-600 mb-0.5">
                                    {selectedVariant.ram} /{" "}
                                    {selectedVariant.storage}
                                  </div>
                                )}

                                {/* Price - COMPACT */}
                                <div className="text-sm font-bold text-gray-900">
                                  {selectedVariant
                                    ? formatPrice(selectedVariant.base_price)
                                    : formatPrice(device.price || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Table Body - COMPACT */}
                  <div>
                    {getSectionSpecs.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Info className="h-6 w-6 text-gray-400" />
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          No specifications found
                        </h4>
                        <p className="text-gray-500 text-sm">
                          Try selecting a different section
                        </p>
                      </div>
                    ) : (
                      getSectionSpecs.map((specKey, rowIndex) => {
                        const Icon =
                          SECTIONS.find((s) => s.id === activeSection)?.icon ||
                          BarChart3;

                        return (
                          <div
                            key={specKey}
                            className={`grid border-t border-gray-100 hover:bg-blue-50/30 transition-all duration-200 ${
                              rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            }`}
                            style={{
                              gridTemplateColumns: `200px repeat(${selectedDevices.length}, minmax(150px, 1fr))`,
                              minHeight: "60px",
                            }}
                          >
                            {/* Sticky Specification Column - COMPACT */}
                            <div className="p-3 border-r border-gray-200 flex items-center sticky left-0 z-10 bg-inherit">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-gray-100 rounded">
                                  <Icon className="h-3 w-3 text-gray-600" />
                                </div>
                                <div className="font-medium text-gray-900 text-xs">
                                  {specKey
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())
                                    .substring(0, 30)}
                                  {specKey.length > 30 ? "..." : ""}
                                </div>
                              </div>
                            </div>

                            {/* Device Specs - COMPACT */}
                            {selectedDevices.map((device) => {
                              const specs = getDeviceSpecs(
                                device,
                                activeSection
                              );
                              const value = specs[specKey];
                              const isEmpty =
                                value === undefined ||
                                value === null ||
                                value === "" ||
                                value === "N/A";

                              const isRating = specKey === "rating";
                              const isPrice = specKey === "price";
                              const isVariant = specKey === "variant";

                              return (
                                <div
                                  key={`${device.id}-${specKey}`}
                                  className="p-3 border-r border-gray-200 last:border-r-0 flex items-center"
                                >
                                  {isRating && value ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3 w-3 ${
                                              i < Math.floor(Number(value) || 0)
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="font-semibold text-gray-900 text-xs">
                                        {value}
                                      </span>
                                    </div>
                                  ) : (
                                    <div
                                      className={`text-sm ${
                                        isEmpty
                                          ? "text-gray-400 italic"
                                          : isPrice || isVariant
                                          ? "font-semibold text-gray-900"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {isEmpty
                                        ? "—"
                                        : String(value).substring(0, 40)}
                                      {String(value).length > 40 ? "..." : ""}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={shareComparison}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700 text-sm">
                  Share Comparison
                </span>
              </button>
              <button
                onClick={() => navigate("/devicelist/smartphones")}
                className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700 text-sm">
                  Browse More
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedDevices.length === 0 && !showSearch && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Comparing
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Add 2-4 devices to see detailed specifications side by side
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Device
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCompare;
