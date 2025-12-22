// src/components/BrandShowcase.jsx
import React from "react";
const BrandShowcase = () => {
  const featuredBrands = [
    {
      name: "Apple",
      description: "Premium ecosystem with cutting-edge technology",
      image:
        "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      products: ["iPhone 15 Pro", "MacBook Pro", "Apple Watch", "AirPods"],
      rating: 4.8,
      specialties: ["Design", "Performance", "Ecosystem"],
    },
    {
      name: "Samsung",
      description: "Innovative Android devices and smart technology",
      image:
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      products: ["Galaxy S24", "Galaxy Z Fold", "Galaxy Buds", "Smart TVs"],
      rating: 4.6,
      specialties: ["Display", "Innovation", "Camera"],
    },
    {
      name: "Sony",
      description: "Premium audio and imaging technology",
      image:
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
      products: ["WH-1000XM5", "Alpha Cameras", "PlayStation", "Bravia TV"],
      rating: 4.7,
      specialties: ["Audio", "Camera", "Gaming"],
    },
  ];

  return (
    <section className="my-16 mx-4 lg:mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2
          className="text-2xl lg:text-3xl font-bold flex items-center bg-gradient-to-r 
  from-purple-600 
  to-blue-500 
  bg-clip-text 
  text-transparent  justify-center"
        >
          <i className="fas fa-medal text-yellow-500 mr-3"></i>
          Top Rated Brands
        </h2>
        <p className="text-gray-600 font-semibold mt-2 max-w-2xl mx-auto">
          Discover the most trusted and highly-rated brands in the tech industry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featuredBrands.map((brand, index) => (
          <div
            key={brand.name}
            className="bg-white rounded shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            {/* Brand Header */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={brand.image}
                alt={brand.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4">
                <h3 className="text-2xl font-bold text-white">{brand.name}</h3>
                <div className="flex items-center text-white text-sm mt-1">
                  <div className="flex items-center">
                    <i className="fas fa-star text-yellow-400 mr-1"></i>
                    <span>{brand.rating}</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>Top Rated</span>
                </div>
              </div>
            </div>

            {/* Brand Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">{brand.description}</p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-4">
                {brand.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {/* Popular Products */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <i className="fas fa-bolt text-orange-500 mr-2"></i>
                  Popular Products
                </h4>
                <div className="flex flex-wrap gap-1">
                  {brand.products.map((product) => (
                    <span
                      key={product}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-semibold transition-colors duration-300 text-sm">
                  View Products
                </button>
                <button className="flex-1 border border-gray-300 hover:border-blue-600 hover:text-blue-600 text-gray-600 py-2 px-4 rounded font-semibold transition-colors duration-300 text-sm">
                  Compare
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BrandShowcase;
