import React from "react";

const ProductListingCard = ({ children, className = "", onClick }) => (
  <article
    onClick={onClick}
    className={`group mx-auto h-auto w-full cursor-pointer overflow-hidden rounded-2xl bg-transparent transition duration-200 hover:bg-blue-50/30 ${className}`}
  >
    {children}
  </article>
);

export default ProductListingCard;
