/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React from "react";

const PaymentsPage = () => {
  const banks = [
    { name: "Maybank2u", src: "https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/images/m2u-logo.png" },
    { name: "CIMB Clicks", src: "https://www.cimbclicks.com.my/content/dam/cimbclicks/cimb-clicks-logo.svg" },
    { name: "Public Bank", src: "https://www.pbebank.com/images/layout/logo.png" },
    { name: "RHB Now", src: "https://logodix.com/logo/2034020.png" },
    { name: "Hong Leong Connect", src: "https://s3-ap-southeast-1.amazonaws.com/s3.kinihalal.com/hlb_logo_400x400.png" },
    { name: "AmOnline", src: "https://www.ambank.com.my/Style%20Library/AmBank%202018/images/ambank-logo.png" },
    { name: "Bank Islam", src: "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Bank_Islam_Malaysia_logo.svg/1200px-Bank_Islam_Malaysia_logo.svg.png" },
    { name: "Bank Rakyat", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Logo_Bank_Rakyat.svg/1200px-Logo_Bank_Rakyat.svg.png" },
    { name: "Affin Bank", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Affin_Bank_logo.svg/1200px-Affin_Bank_logo.svg.png" },
    { name: "BSN", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bank_Simpanan_Nasional_Logo.svg/1200px-Bank_Simpanan_Nasional_Logo.svg.png" },
    { name: "UOB", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/United_Overseas_Bank_logo.svg/1200px-United_Overseas_Bank_logo.svg.png" },
    { name: "Standard Chartered", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Standard_Chartered_Logo_2021.svg/1200px-Standard_Chartered_Logo_2021.svg.png" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-8 uppercase">
            WE ACCEPT
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Secure, fast, and reliable payment methods for your convenience.
          </p>
        </div>

        {/* Global Cards & FPX */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            <div className="flex flex-col items-center justify-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Credit / Debit Cards</h2>
              <div className="flex gap-6">
                <img src="https://cdn-icons-png.flaticon.com/128/349/349221.png" alt="Visa" className="h-16 w-auto object-contain" />
                <img src="https://cdn-icons-png.flaticon.com/128/196/196578.png" alt="Mastercard" className="h-16 w-auto object-contain" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Online Banking</h2>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/FPX_logo.svg/1200px-FPX_logo.svg.png" alt="FPX" className="h-16 w-auto object-contain" />
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">E-Wallets</h2>
              <div className="flex gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Touch_%27n_Go_eWallet_logo.svg/1200px-Touch_%27n_Go_eWallet_logo.svg.png" alt="TNG" className="h-12 w-auto object-contain" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Grab_Logo.svg/1200px-Grab_Logo.svg.png" alt="GrabPay" className="h-12 w-auto object-contain" />
              </div>
            </div>

          </div>
        </div>

        {/* Supported Banks grid */}
        <div className="text-center mb-10 mt-16">
          <h2 className="text-3xl font-bold text-gray-900">Supported Banks via FPX</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-center justify-items-center">
          {banks.map((bank) => (
            <div key={bank.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center w-full h-36 hover:shadow-md transition-all">
              <img
                src={bank.src}
                alt={bank.name}
                className="max-h-12 max-w-full object-contain mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden font-semibold text-gray-800 text-center">{bank.name}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PaymentsPage;
