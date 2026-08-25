import React from "react";

const ProductCardMedia = ({ children, className = "" }) => (
  <div
    className={`relative flex h-44 w-full items-center justify-center sm:h-48 lg:h-52 ${className}`}
  >
    {children}
  </div>
);

export default ProductCardMedia;
