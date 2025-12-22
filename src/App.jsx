// src/App.jsx
import React from "react";
import Header from "./components/Home/Header";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Home/Footer";
import Home from "./components/Home/Home";
import Networking from "./components/Device detail/Networking";
import Laptop from "./components/Device detail/Laptop";
import Smartphonelist from "./components/DeviceList/Smartphonelist";
import DeviceComparison from "./components/compare";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import MobileDetailCard from "./components/Device detail/Smartphone";
import MobileCompare from "./components/compare";

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <ScrollToTop />
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/devicelist/networking" element={<Networking />} />
            <Route path="/devicelist/laptop" element={<Laptop />} />
            <Route
              path="/devicelist/smartphones"
              element={<Smartphonelist />}
            />
            <Route
              path="/devicedetail/smartphone"
              element={<MobileDetailCard />}
            />
            <Route path="/compare" element={<MobileCompare />} />
          </Routes>
        </Router>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
