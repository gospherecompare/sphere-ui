// src/components/LatestTech.jsx
import React from "react";
const LatestTech = () => {
  const products = [
    {
      id: 1,
      name: "Smartphone X Pro",
      description:
        "Latest flagship with advanced AI camera and all-day battery life.",
      image:
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      features: [
        '6.7" OLED Display',
        "Triple Camera System",
        "5G Connectivity",
      ],
      price: "$899.00",
    },
    {
      id: 2,
      name: "DSLR Pro X",
      description:
        "Professional DSLR with 45MP full-frame sensor and 4K video.",
      image:
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      features: [
        "45MP Full-Frame Sensor",
        "4K 60fps Video",
        "5-Axis Stabilization",
      ],
      price: "$1,599.00",
    },
    {
      id: 3,
      name: "Router Pro AX",
      description:
        "WiFi 6 router with extended range and advanced security features.",
      image:
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      features: ["WiFi 6 Technology", "5 Gbps Speed", "Advanced Security"],
      price: "$249.00",
    },
    {
      id: 4,
      name: "Wireless Pro Max",
      description:
        "Premium wireless headphones with active noise cancellation.",
      image:
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      features: [
        "Active Noise Cancellation",
        "30-hour Battery",
        "Spatial Audio",
      ],
      price: "$349.00",
    },
  ];

  return (
    <section className="my-10 mx-4 lg:mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h2 className="text-2xl lg:text-3xl font-bold flex items-center text-gray-600 ">
          <i className="fas fa-bolt text-blue-600 mr-3"></i>
          Latest Tech
        </h2>
        <a
          href="#"
          className="text-blue-600 font-semibold flex items-center hover:underline"
        >
          View All
          <i className="fas fa-chevron-right ml-2 transition-transform duration-300 group-hover:translate-x-1"></i>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow-lg overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl flex flex-col md:flex-row"
          >
            <div className="h-48 md:h-auto md:w-1/3 bg-gray-50 flex items-center justify-center p-5">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-full max-w-full "
              />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4 flex-1">{product.description}</p>
              <ul className="space-y-2 mb-4">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="font-bold text-xl text-blue-600 mt-auto">
                {product.price}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LatestTech;
