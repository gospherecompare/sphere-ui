import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import {
  toCloudinaryResponsiveImage,
  toCloudinaryResponsiveSrcSet,
} from "../../utils/cloudinaryImage";
import { API_BASE_URL } from "../../utils/apiUrl";
import { fetchPublicJson } from "../../utils/publicJsonRequest";

const normalizeImages = (value) => {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (!entry || typeof entry !== "object") return "";
      return String(
        entry.image_url || entry.imageUrl || entry.url || entry.src || entry.path || "",
      ).trim();
    })
    .filter(Boolean);
};

const firstImageList = (...values) => {
  for (const value of values) {
    const images = normalizeImages(value);
    if (images.length) return images;
  }
  return [];
};

export const buildSmartphoneImageGroups = (device = {}, fallbackImages = []) => {
  const productImages = firstImageList(
    device.product_images,
    device.productImages,
    fallbackImages,
    device.images,
  );
  const groups = [
    { id: "product", label: "Product Images", images: productImages },
    {
      id: "design",
      label: "Design Images",
      images: firstImageList(
        device.design_images,
        device.designImages,
        device.build_design?.images,
        device.design?.images,
      ),
    },
    {
      id: "rear-camera",
      label: "Rear Camera Images",
      images: firstImageList(
        device.rear_camera_images,
        device.rearCameraImages,
        device.camera?.rear_camera?.images,
        device.camera?.rearCamera?.images,
      ),
    },
    {
      id: "360-view",
      label: "360 View",
      images: firstImageList(
        device.view_360_images,
        device.images_360,
        device.view360Images,
        device.camera?.view_360_images,
      ),
    },
    {
      id: "ui-screenshots",
      label: "UI Screenshot Images",
      images: firstImageList(
        device.ui_screenshot_images,
        device.uiScreenshots,
        device.software?.screenshots,
      ),
    },
  ];

  return groups.filter((group) => group.images.length > 0);
};

const SmartphoneImageGallery = ({
  device,
  images = [],
  productName = "Smartphone",
  initialIndex = 0,
  onClose,
}) => {
  const [activeGroupId, setActiveGroupId] = useState("product");
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [detailImageData, setDetailImageData] = useState(null);
  const [isLoadingAllImages, setIsLoadingAllImages] = useState(false);
  const productId =
    device?.product_id ?? device?.productId ?? device?.id ?? null;
  const groups = useMemo(() => {
    const source = detailImageData
      ? {
          ...device,
          ...detailImageData,
          product_images: detailImageData.images,
          images: detailImageData.images,
        }
      : device;
    return buildSmartphoneImageGroups(
      source,
      detailImageData?.images || images,
    );
  }, [detailImageData, device, images]);
  const activeGroup =
    groups.find((group) => group.id === activeGroupId) || groups[0];
  const activeImages = activeGroup?.images || [];
  const activeImage = activeImages[activeIndex] || activeImages[0] || "";
  const totalImageCount = useMemo(
    () => new Set(groups.flatMap((group) => group.images)).size,
    [groups],
  );

  const goToPrevious = useCallback(() => {
    if (activeImages.length < 2) return;
    setActiveIndex((index) => (index - 1 + activeImages.length) % activeImages.length);
  }, [activeImages.length]);

  const goToNext = useCallback(() => {
    if (activeImages.length < 2) return;
    setActiveIndex((index) => (index + 1) % activeImages.length);
  }, [activeImages.length]);

  useEffect(() => {
    if (!productId) return undefined;
    let isActive = true;
    setIsLoadingAllImages(true);
    fetchPublicJson(
      `${API_BASE_URL}/public/product/${encodeURIComponent(productId)}`,
      { cacheTtlMs: 60_000 },
    )
      .then((product) => {
        if (!isActive) return;
        const fullImages = normalizeImages(
          product?.images || product?.smartphone?.images,
        );
        if (fullImages.length) {
          setDetailImageData({ ...product, images: fullImages });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setIsLoadingAllImages(false);
      });

    return () => {
      isActive = false;
    };
  }, [productId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowLeft") goToPrevious();
      if (event.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNext, goToPrevious, onClose]);

  useEffect(() => {
    if (!groups.some((group) => group.id === activeGroupId)) {
      setActiveGroupId(groups[0]?.id || "product");
      setActiveIndex(0);
    }
  }, [activeGroupId, groups]);

  useEffect(() => {
    if (activeIndex >= activeImages.length) setActiveIndex(0);
  }, [activeImages.length, activeIndex]);

  if (!activeImage || typeof document === "undefined") return null;

  const selectGroup = (group) => {
    setActiveGroupId(group.id);
    setActiveIndex(0);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-0 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close image gallery"
      />
      <section
        className="relative z-10 flex h-full max-h-[940px] w-full max-w-[1440px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(90vh,940px)] sm:rounded-lg"
        role="dialog"
        aria-modal="true"
        aria-label={`${productName} image gallery`}
      >
        <header className="flex min-h-12 shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-2 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-800 sm:text-base">
              {productName}
            </h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              {activeGroup?.label} | {activeIndex + 1} of {activeImages.length}
              {isLoadingAllImages ? " | Loading all photos" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close image gallery"
          >
            <FaTimes />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_190px]">
          <div className="flex min-h-0 min-w-0 flex-col">
            {groups.length > 1 ? (
              <nav
                className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 px-3 py-2 lg:hidden"
                aria-label="Image categories"
              >
                {groups.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => selectGroup(group)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      activeGroup?.id === group.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {group.label} ({group.images.length})
                  </button>
                ))}
              </nav>
            ) : null}

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-white px-8 py-4 sm:px-14 sm:py-6">
              {activeImages.length > 1 ? (
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-blue-700 sm:left-5"
                  aria-label="Previous image"
                >
                  <FaChevronLeft />
                </button>
              ) : null}
              <img
                src={toCloudinaryResponsiveImage(activeImage, 1400)}
                srcSet={toCloudinaryResponsiveSrcSet(activeImage)}
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 75vw, 1000px"
                alt={`${productName}, ${activeGroup?.label.toLowerCase()} ${activeIndex + 1}`}
                className="h-full max-h-full w-full object-contain"
                decoding="async"
              />
              {activeImages.length > 1 ? (
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-blue-700 sm:right-5"
                  aria-label="Next image"
                >
                  <FaChevronRight />
                </button>
              ) : null}
            </div>

            {activeImages.length > 1 ? (
              <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 px-3 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
                  aria-label="Previous thumbnails"
                >
                  <FaChevronLeft />
                </button>
                <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
                  {activeImages.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() => setActiveIndex(index)}
                      className={`h-[68px] w-[68px] shrink-0 overflow-hidden border bg-white p-1 sm:h-[82px] sm:w-[82px] ${
                        activeIndex === index
                          ? "border-blue-700 ring-1 ring-blue-700"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                      aria-label={`View image ${index + 1}`}
                      aria-current={activeIndex === index ? "true" : undefined}
                    >
                      <img
                        src={toCloudinaryResponsiveImage(image, 180)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goToNext}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
                  aria-label="Next thumbnails"
                >
                  <FaChevronRight />
                </button>
              </div>
            ) : null}
          </div>

          {groups.length > 0 ? (
            <aside className="hidden min-h-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-3 lg:block">
              {groups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => selectGroup(group)}
                  className={`mb-2 flex w-full flex-col items-start rounded-md p-2 text-left transition ${
                    activeGroup?.id === group.id
                      ? "bg-white shadow-sm ring-1 ring-blue-200"
                      : "hover:bg-white"
                  }`}
                >
                  <span className="text-xs font-medium text-slate-700">
                    {group.label} ({group.images.length})
                  </span>
                  <span className="mt-2 flex h-16 w-[72px] items-center justify-center border border-slate-200 bg-white p-1">
                    <img
                      src={toCloudinaryResponsiveImage(group.images[0], 150)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </span>
                </button>
              ))}
              <p className="px-2 pt-1 text-[10px] text-slate-400">
                {totalImageCount} images
              </p>
            </aside>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default SmartphoneImageGallery;
