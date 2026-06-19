import React from 'react';
import Image from 'next/image';

const PaymentsPage = () => {
  return (
    <div className="min-h-screen py-16 px-4 md:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-primary tracking-tight">
          WE ACCEPT
        </h1>

        <p className="text-center text-gray-600 mb-12 text-lg">
          At Kampung Cetak, we offer a variety of secure and convenient payment methods to ensure a smooth checkout experience.
        </p>

        <div className="space-y-12">
          {/* Credit & Debit Cards */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Credit & Debit Cards</h2>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <img src="https://cdn-icons-png.flaticon.com/128/349/349221.png" alt="Visa" className="h-12 w-auto" />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <img src="https://cdn-icons-png.flaticon.com/128/196/196578.png" alt="Mastercard" className="h-12 w-auto" />
              </div>
            </div>
          </div>

          {/* Online Banking (FPX) */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Online Banking (FPX)</h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 flex items-center gap-4 w-fit">
               <img src="https://cdn.iconscout.com/icon/free/png-256/fpx-3628775-3030206.png" alt="FPX" className="h-12 w-auto object-contain bg-white rounded p-1" />
               <span className="font-semibold text-lg text-gray-700">Supported Malaysian Banks</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Maybank2u', 'CIMB Clicks', 'Public Bank', 'RHB Now', 'AmBank', 'Hong Leong Connect', 'Bank Islam', 'Alliance Bank'].map((bank) => (
                <div key={bank} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center text-center font-medium text-sm text-gray-700">
                  {bank}
                </div>
              ))}
            </div>
          </div>

          {/* E-Wallets */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">E-Wallets & Others</h2>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <img src="https://cdn-icons-png.flaticon.com/128/174/174861.png" alt="PayPal" className="h-12 w-auto" />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-2">
                <img src="https://cdn-icons-png.flaticon.com/128/888/888871.png" alt="Apple Pay" className="h-12 w-auto" />
                <span className="font-semibold">Apple Pay</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-2">
                <img src="https://cdn-icons-png.flaticon.com/128/6124/6124998.png" alt="Google Pay" className="h-12 w-auto" />
                <span className="font-semibold">Google Pay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
