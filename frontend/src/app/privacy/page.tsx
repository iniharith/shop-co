/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">Privacy Policy</h1>
        <div className="prose prose-lg text-gray-600 max-w-none">
          <p className="mb-6">
            At <strong>Kampung Cetak</strong>, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
            <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Site.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Use of Your Information</h2>
          <p className="mb-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Create and manage your account.</li>
            <li>Process your transactions and deliver the products and services requested.</li>
            <li>Email you regarding your account or order.</li>
            <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
            <li>Respond to product and customer service requests.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Disclosure of Your Information</h2>
          <p className="mb-6">
            We may share information we have collected about you in certain situations. Your information may be disclosed as follows: By Law or to Protect Rights, Third-Party Service Providers, Marketing Communications, and Business Transfers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Security of Your Information</h2>
          <p className="mb-6">
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Contact Us</h2>
          <p className="mb-6">
            If you have questions or comments about this Privacy Policy, please contact us at:
            <br/><br/>
            <strong>Kampung Cetak</strong><br/>
            Email: admin@kampungcetak.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
