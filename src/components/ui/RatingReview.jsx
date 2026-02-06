import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaPlus,
  FaTrash,
  FaEdit,
  FaThumbsUp,
  FaUser,
} from "react-icons/fa";
import Cookies from "js-cookie";

const RatingReview = ({
  productId,
  productName,
  brand,
  onReviewSubmitted,
  isLoading = false,
}) => {
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [ratingsData, setRatingsData] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [newReview, setNewReview] = useState({
    overall_rating: 0,
    review: "",
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const token = Cookies.get("arenak");

  // Fetch ratings summary for smartphone
  const fetchReviews = async () => {
    try {
      setFetchLoading(true);
      const prodId = productId; // prop is product id when used in Smartphone.jsx
      if (!prodId) {
        setFetchLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/public/products/${prodId}/ratings`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setRatingsData({
          averageRating: parseFloat(data.averageRating) || 0,
          totalRatings: parseInt(data.totalRatings) || 0,
          ratingDistribution: data.ratingDistribution || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        });
      } else {
        setReviews([]);
        setRatingsData({
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setRatingsData({
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    } else {
      setFetchLoading(false);
    }
  }, [productId, token]);

  // Submit or update review
  const handleSubmitReview = async () => {
    if (newReview.overall_rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setSubmitLoading(true);

      const prodId = productId;
      if (!prodId) {
        alert("Product not identified");
        return;
      }

      if (!token) {
        alert("Please login to submit a review");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/public/products/${prodId}/ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            overall: newReview.overall_rating,
            review: newReview.review,
          }),
        }
      );

      if (response.ok) {
        alert(
          editingReviewId
            ? "Review updated successfully!"
            : "Review submitted successfully!"
        );
        setEditingReviewId(null);
        setNewReview({ overall_rating: 0, review: "" });
        setShowReviewForm(false);
        fetchReviews();
        onReviewSubmitted && onReviewSubmitted();
      } else {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Non-JSON error response", e);
        }
        alert((errorData && errorData.message) || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Review deleted successfully!");
        fetchReviews();
        onReviewSubmitted && onReviewSubmitted();
      } else {
        alert("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review");
    }
  };

  // Edit review
  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setNewReview({
      overall_rating: review.overall_rating,
      review: review.review || "",
    });
    setShowReviewForm(true);
  };

  // Render star rating
  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={`text-2xl transition-all ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-300" : ""}`}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  // Rating distribution bar
  const RatingBar = ({ stars, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-6">{stars}★</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
      </div>
    );
  };

  if (isLoading || fetchLoading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="text-center py-8">
          <div className="inline-block">
            <FaStar className="text-yellow-400 text-3xl animate-pulse" />
          </div>
          <p className="text-gray-500 mt-3">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Product information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ratings Summary Card */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaStar className="text-yellow-400" />
            Ratings & Reviews
          </h3>
          {token && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <FaPlus />
              Add Your Review
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center p-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {ratingsData.averageRating?.toFixed(1) || "0.0"}
              <span className="text-2xl text-gray-500">/5</span>
            </div>
            <div className="flex justify-center mb-4">
              {renderStars(Math.round(ratingsData.averageRating || 0))}
            </div>
            <div className="text-gray-600 font-medium">
              Based on {ratingsData.totalRatings || 0} ratings
            </div>
            <div className="mt-4 text-sm text-gray-700">
              {ratingsData.averageRating >= 4
                ? "⭐ Excellent Product"
                : ratingsData.averageRating >= 3
                ? "👍 Good Product"
                : ratingsData.averageRating >= 2
                ? "⚠️ Average Product"
                : ratingsData.averageRating > 0
                ? "❌ Poor Product"
                : "No ratings yet"}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6 text-lg">
              Rating Breakdown
            </h4>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((stars) => (
                <RatingBar
                  key={stars}
                  stars={stars}
                  count={ratingsData.ratingDistribution?.[stars] || 0}
                  total={ratingsData.totalRatings || 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingReviewId ? "Edit Your Review" : "Write a Review"}
          </h4>

          <div className="space-y-4">
            {/* Rating Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-4">
                {renderStars(newReview.overall_rating, true, (rating) =>
                  setNewReview({ ...newReview, overall_rating: rating })
                )}
                <span className="text-lg font-semibold text-gray-700">
                  {newReview.overall_rating > 0
                    ? `${newReview.overall_rating}/5`
                    : "Select rating"}
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={newReview.review}
                onChange={(e) =>
                  setNewReview({ ...newReview, review: e.target.value })
                }
                placeholder="Share your experience with this product..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">Max 500 characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={submitLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {submitLoading
                  ? "Submitting..."
                  : editingReviewId
                  ? "Update Review"
                  : "Submit Review"}
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setEditingReviewId(null);
                  setNewReview({ overall_rating: 0, review: "" });
                }}
                disabled={submitLoading}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews && reviews.length > 0 && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Customer Reviews ({reviews.length})
          </h3>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <FaUser className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.customer_name || "Anonymous User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Edit/Delete buttons - only show for user's own review */}
                  {token && review.is_user_review && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit review"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete review"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="mb-3">{renderStars(review.overall_rating)}</div>

                {/* Review Text */}
                {review.review && (
                  <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                    {review.review}
                  </p>
                )}

                {/* Review meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {review.helpful_count > 0 && (
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <FaThumbsUp className="text-green-500" />
                      {review.helpful_count} found helpful
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews Message */}
      {(!reviews || reviews.length === 0) && !showReviewForm && (
        <div className="bg-white rounded-lg p-8 text-center">
          <FaStar className="text-yellow-400 text-4xl mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Be the first to review {productName && `${brand} ${productName}`}
          </p>
          {token && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors mx-auto"
            >
              <FaPlus />
              Write First Review
            </button>
          )}
          {!token && (
            <p className="text-sm text-gray-500">
              Please login to write a review
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingReview;


