import React from "react";

const ListingFeatureChips = ({ features = [], activeId = "", onSelect }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {features.map((feature) => {
      const Icon = feature.icon;
      const isActive = activeId === feature.id;
      return (
        <button
          key={feature.id}
          type="button"
          onClick={() => onSelect?.(feature.id)}
          aria-pressed={isActive}
          className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition ${
            isActive
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
          }`}
        >
          {Icon ? (
            <Icon className={isActive ? "text-white" : "text-blue-600"} />
          ) : null}
          <span>{feature.name}</span>
        </button>
      );
    })}
  </div>
);

export default ListingFeatureChips;
