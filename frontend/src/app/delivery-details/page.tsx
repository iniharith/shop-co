/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React from "react";

const DeliveryPage = () => {
  const partners = [
    { name: "J&T Express", src: "https://www.jtexpress.my/assets/img/logo.png" },
    { name: "Pos Laju", src: "https://www.pos.com.my/media/wysiwyg/pos-logo.png" },
    { name: "Ninja Van", src: "https://www.ninjavan.co/wp-content/uploads/sites/4/2021/04/ninjavan-logo-dark.png" },
    { name: "DHL eCommerce", src: "https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg" },
    { name: "City-Link Express", src: "https://www.citylinkexpress.com/wp-content/uploads/2020/06/citylink-logo-dark.png" },
    { name: "GDEX", src: "https://www.gdexpress.com/malaysia/wp-content/uploads/2019/12/logo-gdex.png" },
    { name: "Lalamove", src: "https://www.lalamove.com/hubfs/Lalamove%20Website%202020/logo/Lalamove_Logo_Color.svg" },
    { name: "GrabExpress", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Grab_Logo.svg/512px-Grab_Logo.svg.png" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-8">
            OUR PARTNER FOR DELIVERY
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            We partner with the best courier services in Malaysia to ensure your prints arrive safely and on time.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
          {partners.map((partner) => (
            <div key={partner.name} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center w-full h-40 hover:shadow-md transition-all">
              {/* Note: We use standard img tags here because some external logos might not be configured in next.config.js */}
              {partner.name === "GrabExpress" ? (
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={partner.src}
                    alt={partner.name}
                    className="max-h-16 max-w-full object-contain mb-2"
                  />
                  <span className="font-bold text-gray-800 text-lg">Express</span>
                </div>
              ) : (
                <img
                  src={partner.src}
                  alt={partner.name}
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to text if logo fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              <span className="hidden font-bold text-gray-800 text-xl text-center">{partner.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-20 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg text-gray-600">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Processing Time</h3>
                    <p>All orders require a processing time depending on the printing method and product. Standard processing takes 3-5 business days before the item is handed over to our delivery partners.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Time</h3>
                    <p>Peninsular Malaysia: 1-3 working days.<br/>Sabah & Sarawak: 3-5 working days.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tracking Your Order</h3>
                    <p>Once your order has been shipped, you will receive a tracking number via email and you can also track it through your account dashboard.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Self-Pickup</h3>
                    <p>Self-pickup is available at our main office in Selangor during working hours. Please wait for the confirmation email before coming to collect your order.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
