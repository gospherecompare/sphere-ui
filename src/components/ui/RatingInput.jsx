// src/components/ui/RatingInput.jsx
import React from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

const RatingInput = ({ value, onChange, size = "md", readOnly = false }) => {
  const sizes = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const renderStar = (index) => {
    const starValue = index + 1;
    const isFull = starValue <= Math.floor(value);
    const isHalf = starValue === Math.ceil(value) && value % 1 !== 0;

    if (readOnly) {
      if (isFull) {
        return <FaStar className={`text-yellow-400 ${sizes[size]}`} />;
      } else if (isHalf) {
        return <FaStarHalfAlt className={`text-yellow-400 ${sizes[size]}`} />;
      } else {
        return <FaRegStar className={`text-gray-300 ${sizes[size]}`} />;
      }
    }

    return (
      <button
        type="button"
        onClick={() => handleClick(starValue)}
        className="transition-transform hover:scale-110 focus:outline-none"
        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
      >
        {starValue <= value ? (
          <FaStar
            className={`text-yellow-400 ${sizes[size]} transition-colors duration-200`}
          />
        ) : (
          <FaRegStar
            className={`text-gray-300 hover:text-yellow-300 ${sizes[size]} transition-colors duration-200`}
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <span key={index}>{renderStar(index)}</span>
      ))}
      {!readOnly && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingInput;
