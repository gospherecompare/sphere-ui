const UPCOMING_LAUNCH_STAGES = new Set(["rumored", "announced", "upcoming"]);

export const getCanonicalLifecycle = (device) => {
  const lifecycle = device?.lifecycle;
  if (lifecycle?.launch && lifecycle?.sale && lifecycle?.store) {
    return lifecycle;
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
      type: UPCOMING_LAUNCH_STAGES.has(launchStage) ? "upcoming" : "released",
      display_status: UPCOMING_LAUNCH_STAGES.has(launchStage)
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
