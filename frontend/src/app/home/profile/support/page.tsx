/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from 'react';
import { FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa6';

const ProfileSupportPage = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-6">Customer Support</h2>
      <p className="text-gray-600 mb-8">
        Need help with your orders or artwork? Our support team is here to assist you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center text-center border border-gray-100">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FaWhatsapp className="text-2xl text-green-600" />
          </div>
          <h3 className="font-bold mb-2">WhatsApp</h3>
          <p className="text-sm text-gray-500 mb-4 flex-grow">
            Fastest response time for urgent matters.
          </p>
          <a 
            href="https://wa.me/601116141946" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Chat on WhatsApp
          </a>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center text-center border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FaEnvelope className="text-2xl text-blue-600" />
          </div>
          <h3 className="font-bold mb-2">Email Us</h3>
          <p className="text-sm text-gray-500 mb-4 flex-grow">
            Send us detailed inquiries and files.
          </p>
          <a 
            href="mailto:support@kampungcetak.com" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Email Support
          </a>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center text-center border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <FaPhone className="text-2xl text-purple-600" />
          </div>
          <h3 className="font-bold mb-2">Call Us</h3>
          <p className="text-sm text-gray-500 mb-4 flex-grow">
            Speak directly with our specialists.
          </p>
          <a 
            href="tel:+601116141946" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Call +601116141946
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileSupportPage;
