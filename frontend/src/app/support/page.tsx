/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from 'react';
import Link from 'next/link';
import { FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa6';

const SupportPage = () => {
  return (
    <div className="min-h-screen py-16 bg-gray-50 dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-foreground mb-4">How can we help?</h1>
          <p className="text-xl text-gray-600 dark:text-muted-foreground">Our support team is here for you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* WhatsApp Support */}
          <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-border flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <FaWhatsapp className="text-3xl text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-foreground">WhatsApp Chat</h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-6 flex-grow">
              Fastest response time. Chat directly with our customer support team via WhatsApp.
            </p>
            <a 
              href="https://wa.me/601116141946" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              Chat Now
            </a>
          </div>

          {/* Email Support */}
          <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-border flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
              <FaEnvelope className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-foreground">Email Us</h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-6 flex-grow">
              Send us an email with your artwork files or detailed inquiries.
            </p>
            <a 
              href="mailto:support@kampungcetak.com" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              Send Email
            </a>
          </div>

          {/* Phone Support */}
          <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-border flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <FaPhone className="text-3xl text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-foreground">Call Us</h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-6 flex-grow">
              Speak directly with our printing specialists during business hours.
            </p>
            <a 
              href="tel:+601116141946" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              Call +601116141946
            </a>
          </div>
        </div>

        {/* FAQs Link */}
        <div className="mt-16 bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-border flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-foreground">Need quick answers?</h3>
            <p className="text-gray-600 dark:text-muted-foreground">Check out our frequently asked questions.</p>
          </div>
          <div className="mt-6 sm:mt-0">
            <Link 
              href="/home/faqs" 
              className="bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3 px-8 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors inline-block"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
