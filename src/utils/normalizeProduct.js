// normalizeProduct: produce a minimal identity for any product payload
export function normalizeProduct(apiDevice = {}, productType = "") {
  const productId =
    apiDevice.product_id ??
    apiDevice.id ??
    apiDevice.productId ??
    apiDevice.id_str ??
    null;
  const name = apiDevice.name ?? apiDevice.model ?? apiDevice.title ?? "";

  const images =
    apiDevice.images ?? apiDevice.pictures ?? apiDevice.photos ?? [];

  const variantsRaw = Array.isArray(apiDevice.variants)
    ? apiDevice.variants
    : [];
  const variants = variantsRaw.map((v) => ({
    variantId: v.variant_id ?? v.id ?? null,
    ram: v.ram ?? v.memory ?? null,
    storage: v.storage ?? v.internal_storage ?? null,
    basePrice: v.base_price ?? v.basePrice ?? v.price ?? null,
    storePrices: Array.isArray(v.store_prices)
      ? v.store_prices.map((s) => ({
          id: s.id ?? null,
          storeName: s.store_name ?? s.store ?? null,
          price: s.price ?? null,
          url: s.url ?? null,
          offerText: s.offer_text ?? s.offer ?? null,
          deliveryInfo: s.delivery_info ?? null,
        }))
      : [],
  }));

  // compute lowest price across all variant store prices
  let lowestPrice = null;
  variants.forEach((v) => {
    v.storePrices.forEach((s) => {
      if (typeof s.price === "number") {
        if (lowestPrice === null || s.price < lowestPrice)
          lowestPrice = s.price;
      }
    });
    if (typeof v.basePrice === "number") {
      if (lowestPrice === null || v.basePrice < lowestPrice)
        lowestPrice = v.basePrice;
    }
  });

  return {
    productId,
    // aliases for compatibility
    id: productId,
    product_id: productId,
    productType:
      productType ||
      apiDevice.product_type ||
      apiDevice.deviceType ||
      apiDevice.type ||
      "",
    name,
    model: apiDevice.model ?? apiDevice.title ?? null,

    // common fields
    brand: apiDevice.brand_name ?? apiDevice.brand ?? null,
    category: apiDevice.category ?? null,
    launchDate: apiDevice.launch_date
      ? new Date(apiDevice.launch_date).toISOString()
      : null,
    colors: apiDevice.colors ?? apiDevice.color ?? null,

    // structured sub-objects (pass-through when available)
    buildDesign:
      apiDevice.build_design ??
      apiDevice.buildDesign ??
      apiDevice.design ??
      null,
    display: apiDevice.display ?? null,
    performance: apiDevice.performance ?? apiDevice.specs ?? null,
    camera: apiDevice.camera ?? null,
    battery: apiDevice.battery ?? null,
    connectivity: apiDevice.connectivity ?? null,
    network: apiDevice.network ?? null,
    ports: apiDevice.ports ?? null,
    audio: apiDevice.audio ?? null,
    multimedia: apiDevice.multimedia ?? null,
    sensors: apiDevice.sensors ?? null,

    // pricing & variants
    variants,
    lowestPrice,

    images,

    rating: apiDevice.rating ?? null,
    createdAt: apiDevice.created_at ?? apiDevice.createdAt ?? null,

    // keep original payload for anything else
    _raw: apiDevice,
  };
}

export default normalizeProduct;
