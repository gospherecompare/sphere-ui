// src/components/FeaturedProduct.jsx
import React from 'react';
const FeaturedProduct = () => {
  return (
    <section className="my-10 mx-4 lg:mx-auto max-w-7xl">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h2 className="text-2xl lg:text-3xl font-bold flex items-center">
          <i className="fas fa-star text-blue-600 mr-3"></i>
          Featured Product
        </h2>
        <a href="#" className="text-blue-600 font-semibold flex items-center hover:underline">
          View All
          <i className="fas fa-chevron-right ml-2 transition-transform duration-300 group-hover:translate-x-1"></i>
        </a>
      </div>

      {/* Featured Product Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">iQOO Neo 10</h2>
            <p className="text-gray-600 mt-1">
              Release Date: <span className="font-medium">26 May, 2025</span>
            </p>
          </div>
          <button className="text-orange-500 font-semibold text-sm hover:text-orange-600">
            + Compare
          </button>
        </div>

        {/* Card Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Section */}
          <div className="flex-1 flex flex-col items-center">
            <img
              src="https://fdn2.gsmarena.com/vv/pics/iqoo/iqoo-neo10-1.jpg"
              alt="iQOO Neo 10"
              className="w-48 rounded-xl border border-gray-200"
            />
            <a href="#" className="text-blue-600 text-sm mt-2 hover:underline">
              View Photos (62)
            </a>
          </div>

          {/* Details Section */}
          <div className="flex-2">
            <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold mb-4">
              94% Spec Score
            </span>

            <ul className="space-y-2 text-gray-700 text-sm mb-4">
              <li>⚙️ Snapdragon 8s Gen 4</li>
              <li>💾 8 GB RAM</li>
              <li>📸 50 MP + 8 MP Rear Camera | 32 MP Front Camera</li>
              <li>🔋 7000 mAh | ⚡ 120W Flash Charging</li>
              <li>📱 6.78 inches (17.22 cm) | AMOLED</li>
            </ul>

            <a href="#" className="text-blue-600 text-sm hover:underline mb-4 inline-block">
              View All Specs
            </a>

            <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-700 text-sm mb-4">
              🏆 Best Phones Under Rs. 40,000
            </div>

            <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-700 mb-6 space-y-2 sm:space-y-0">
              <div>
                <strong>User Rating:</strong> ⭐ 4.4/5 (1,299 Ratings)
              </div>
              <div>
                <strong>Expert Rating:</strong> 8.5/10
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Flipkart_logo.png"
                  alt="Flipkart"
                  className="h-6"
                />
                <p className="text-xl font-bold text-gray-900">₹32,945</p>
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300">
                Go To Store
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;