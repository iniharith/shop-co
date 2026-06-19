import React from "react";
import Image from "next/image";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/kampung-cetak-logo.png"
              alt="Kampung Cetak Logo"
              width={120}
              height={120}
              className="rounded-2xl shadow-sm object-contain"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight mb-4">
            About <span className="text-[#E00000]">Kampung Cetak</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500 italic">
            "We take pride in our work and customer satisfaction is what sets KAMPUNG CETAK apart from the competition."
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-16">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Established in 2004, KAMPUNG CETAK is one of the nation's leading printing companies. We are a one-stop center for business promotional item solutions. We provide a wide range of services in the printing industry.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our passionate team, integrated services, and turnkey solutions are what clients require today. We don't talk about quality. We prove it. We stand behind our commitment to results. Whether you are looking to promote a product or advertise a service, we can help you to design and produce an impactful visual presentation that will reach your audience and facilitate your business growth nationwide.
              </p>
            </div>
            <div className="md:w-1/2 bg-[#E00000]/5 flex items-center justify-center p-12">
               <Image
                src="/images/kampung-cetak-logo.png"
                alt="Kampung Cetak Printing"
                width={400}
                height={400}
                className="opacity-90 mix-blend-multiply"
              />
            </div>
          </div>
        </div>

        {/* Strength Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Our Strengths</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto text-lg">
            Kampung Cetak offers a one-stop center for printing solutions to our clients in business essentials, events, promotional items, display & advertising, packaging & labeling, and creative visuals. No matter how small or big your business is, KAMPUNG CETAK has the flexibility to help you promote and improve your company or business brand.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#E00000] mb-3">More than 20 Years of Excellence</h3>
              <p className="text-gray-600">With 20 years of excellent experience, we have sufficient capabilities to resolve customer inquiries.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#E00000] mb-3">Expert Team</h3>
              <p className="text-gray-600">KAMPUNG CETAK has an expert and dedicated team to cater to your inquiries up to design, production, and delivery.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#E00000] mb-3">One-Stop Centre Production</h3>
              <p className="text-gray-600">We are a one-stop center for printing solutions to provide impactful promotional items to facilitate your business growth.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#E00000] mb-3">Quality Product</h3>
              <p className="text-gray-600">KAMPUNG CETAK puts quality as our top priority. We provide bright inks, precise cuts, and outstanding finishing.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#E00000] mb-3">Timely Delivery</h3>
              <p className="text-gray-600">Customer satisfaction is our priority. KAMPUNG CETAK will make sure your order is completed on time with no compromise.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#E00000] mb-3">Customer Gratification</h3>
              <p className="text-gray-600">We guarantee a quality product that satisfies your investment. We are dedicated to providing the best quality products to our valuable customers.</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="bg-gray-900 text-white rounded-3xl overflow-hidden mb-16">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-gray-800">
              <h2 className="text-3xl font-bold mb-8 text-[#E00000]">Our Mission</h2>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <span className="text-[#E00000] font-bold text-xl mr-4">01</span>
                  <p className="text-gray-300">We are a business promotional item provider through printing methods.</p>
                </li>
                <li className="flex items-start">
                  <span className="text-[#E00000] font-bold text-xl mr-4">02</span>
                  <p className="text-gray-300">We provide a wide-range of business promotional items that focus on entrepreneurs and organizations to empower their business nationwide.</p>
                </li>
                <li className="flex items-start">
                  <span className="text-[#E00000] font-bold text-xl mr-4">03</span>
                  <p className="text-gray-300">Our primary responsibility is to facilitate business growth through impactful visual presentations.</p>
                </li>
                <li className="flex items-start">
                  <span className="text-[#E00000] font-bold text-xl mr-4">04</span>
                  <p className="text-gray-300">We strive to empower the nation with knowledge and skills to achieve success.</p>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center text-center">
              <h2 className="text-3xl font-bold mb-6 text-[#E00000]">Our Vision</h2>
              <p className="text-2xl text-gray-300 italic font-medium leading-relaxed">
                "To be a preferred integrated printing solution for business promotional items in Malaysia."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
