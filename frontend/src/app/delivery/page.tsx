import React from 'react';

const deliveryPartners = [
  { name: 'J&T Express', logo: 'https://jtexpress.my/assets/images/logo/logo-header.png' },
  { name: 'Pos Laju', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Pos_Malaysia_Logo.png' },
  { name: 'Ninja Van', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Ninja_Van_Logo.png' },
  { name: 'DHL Express', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg' },
  { name: 'Shopee Express', logo: 'https://down-my.img.susercontent.com/file/sg-11134004-7rbnl-lp2r7s3663erfc' }, // placeholder/shopee
  { name: 'Lalamove', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Lalamove_logo.svg/2560px-Lalamove_logo.svg.png' },
  { name: 'Flash Express', logo: 'https://s3-ap-southeast-1.amazonaws.com/flashexpress.com/malaysia/website/images/logo/flash-logo-en.png' },
  { name: 'City-Link Express', logo: 'https://www.citylinkexpress.com/wp-content/uploads/2019/08/City-Link-Express-Logo-01.png' },
];

const DeliveryPage = () => {
  return (
    <div className="min-h-screen py-16 px-4 md:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary tracking-tight uppercase">
            Our Partners For Delivery
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We work with the best courier services in Malaysia to ensure your prints reach you safely and on time.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deliveryPartners.map((partner) => (
            <div key={partner.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all">
              <div className="h-16 w-full flex items-center justify-center relative">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="font-bold text-gray-800">${partner.name}</span>`;
                  }}
                />
              </div>
              <h3 className="font-semibold text-sm text-gray-700">{partner.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
