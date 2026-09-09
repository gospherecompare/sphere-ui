const UPCOMING_LAUNCH_STAGES = new Set(["rumored", "announced", "upcoming"]);

export const getCanonicalLifecycle = (device) => {
  const lifecycle = device?.lifecycle;
  if (lifecycle?.launch && lifecycle?.sale && lifecycle?.store) {
    const unreleased = UPCOMING_LAUNCH_STAGES.has(lifecycle.launch.stage);
    const saleScheduled = lifecycle.sale.stage === "sale_scheduled";
    return {
      ...lifecycle,
      render: {
        ...(lifecycle.render || {}),
        type: unreleased || saleScheduled ? "upcoming" : "released",
        display_status: unreleased
          ? "Expected"
          : saleScheduled
            ? "Upcoming"
            : "Released",
      },
    };
  }

  const launchStage = String(
    device?.launch_status ?? device?.launchStatus ?? "upcoming",
  ).toLowerCase();
  const saleStage = String(
    device?.sale_status ?? device?.saleStatus ?? "sale_tbd",
  ).toLowerCase();
  const storeStage = String(
    device?.store_stage ?? device?.storeStage ?? "none",
  ).toLowerCase();
  const unreleased = UPCOMING_LAUNCH_STAGES.has(launchStage);
  const saleScheduled = saleStage === "sale_scheduled";

  return {
    launch: {
      stage: launchStage,
      date: device?.launch_date ?? device?.launchDate ?? null,
      date_type: device?.launch_date_type ?? device?.launchDateType ?? null,
      mode: device?.launch_status_mode ?? device?.launchStatusMode ?? "auto",
    },
    sale: {
      stage: saleStage,
      start_date:
        device?.sale_start_date ??
        device?.saleStartDate ??
        device?.available_date ??
        device?.availableDate ??
        null,
    },
    store: { stage: storeStage },
    render: {
      type: unreleased || saleScheduled ? "upcoming" : "released",
      display_status: unreleased
        ? "Expected"
        : saleScheduled
          ? "Upcoming"
          : "Released",
    },
    allow_compare: device?.allow_compare ?? device?.allowCompare ?? false,
    allow_competitors:
      device?.allow_competitors ?? device?.allowCompetitors ?? false,
    allow_spec_score:
      device?.allow_spec_score ?? device?.allowSpecScore ?? false,
  };
};

export const getCanonicalLaunchStage = (device) =>
  getCanonicalLifecycle(device).launch.stage;

export const getCanonicalSaleStage = (device) =>
  getCanonicalLifecycle(device).sale.stage;

export const getCanonicalStoreStage = (device) =>
  getCanonicalLifecycle(device).store.stage;

export const getCanonicalRenderType = (device) =>
  getCanonicalLifecycle(device).render.type;

export const getCanonicalSaleStartDate = (device) =>
  getCanonicalLifecycle(device).sale.start_date;

export const resolveSmartphoneDisplayState = (device, today = new Date()) => {
  const lifecycle = getCanonicalLifecycle(device);
  const saleDate = lifecycle.sale.start_date
    ? String(lifecycle.sale.start_date).slice(0, 10)
    : null;
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const parsedSaleDate = saleDate ? new Date(`${saleDate}T00:00:00`) : null;
  const saleScheduled =
    lifecycle.sale.stage === "sale_scheduled" &&
    parsedSaleDate &&
    !Number.isNaN(parsedSaleDate.getTime()) &&
    parsedSaleDate > todayDate;
  const unreleased = UPCOMING_LAUNCH_STAGES.has(lifecycle.launch.stage);
  const upcoming = Boolean(saleScheduled || unreleased);

  return {
    primaryLabel: upcoming
      ? unreleased
        ? "Expected"
        : "Upcoming"
      : lifecycle.sale.stage === "sale_tbd"
        ? "Sale TBA"
        : lifecycle.store.stage === "listed"
          ? "Listed"
          : "Available now",
    dateLabel: upcoming && saleScheduled ? "Sale starts" : null,
    date: upcoming && saleScheduled ? saleDate : null,
    storeLabel:
      lifecycle.store.stage === "prebooking"
        ? "Pre-booking"
        : lifecycle.store.stage === "listed"
          ? "Listed"
          : lifecycle.store.stage === "live"
            ? "Available"
            : null,
    showBuyButton: lifecycle.store.stage === "live" && !upcoming,
    isUpcoming: upcoming,
  };
};

export const getCanonicalPolicy = (device) => {
  const lifecycle = getCanonicalLifecycle(device);
  return {
    stage: lifecycle.launch.stage,
    allowCompare: lifecycle.allow_compare === true,
    allowCompetitors: lifecycle.allow_competitors === true,
    allowSpecScore: lifecycle.allow_spec_score === true,
    compareLimit: lifecycle.allow_compare === true ? 4 : 0,
    competitorLimit: lifecycle.allow_competitors === true ? 5 : 0,
  };
};
