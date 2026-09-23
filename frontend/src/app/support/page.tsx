/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from 'react';
import Link from 'next/link';
import { FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa6';

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-background py-16 text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="mb-4 text-4xl font-extrabold">How can we help?</h1>
          <p className="text-xl text-muted-foreground">Our support team is here for you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* WhatsApp Support */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-green-900/30">
              <FaWhatsapp className="text-3xl text-foreground dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold">WhatsApp Chat</h3>
            <p className="mb-6 flex-grow text-muted-foreground">
              Fastest response time. Chat directly with our customer support team via WhatsApp.
            </p>
            <a 
              href="https://wa.me/601116141946" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-85 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 dark:hover:opacity-100"
            >
              Chat Now
            </a>
          </div>

          {/* Email Support */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-blue-900/30">
              <FaEnvelope className="text-3xl text-foreground dark:text-blue-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Email Us</h3>
            <p className="mb-6 flex-grow text-muted-foreground">
              Send us an email with your artwork files or detailed inquiries.
            </p>
            <a 
              href="mailto:support@kampungcetak.com" 
              className="w-full rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-85 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:hover:opacity-100"
            >
              Send Email
            </a>
          </div>

          {/* Phone Support */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-purple-900/30">
              <FaPhone className="text-3xl text-foreground dark:text-purple-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Call Us</h3>
            <p className="mb-6 flex-grow text-muted-foreground">
              Speak directly with our printing specialists during business hours.
            </p>
            <a 
              href="tel:+601116141946" 
              className="w-full rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-85 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700 dark:hover:opacity-100"
            >
              Call +601116141946
            </a>
          </div>
        </div>

        {/* FAQs Link */}
        <div className="mt-16 flex flex-col items-center justify-between rounded-2xl border border-border bg-card p-8 shadow-sm sm:flex-row">
          <div>
            <h3 className="mb-2 text-2xl font-bold">Need quick answers?</h3>
            <p className="text-muted-foreground">Check out our frequently asked questions.</p>
          </div>
          <div className="mt-6 sm:mt-0">
            <Link 
              href="/home/faqs" 
              className="inline-block rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-85 dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:hover:opacity-100"
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
