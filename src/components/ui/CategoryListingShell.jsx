import React from "react";

const CategoryListingShell = ({ children, className = "" }) => (
  <main className={`min-h-screen bg-[#f3f6fb] text-slate-950 ${className}`}>
    {children}
  </main>
);

export default CategoryListingShell;
