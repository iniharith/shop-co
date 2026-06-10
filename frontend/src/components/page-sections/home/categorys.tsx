"use client";
import { useRouter } from "nextjs-toploader/app";
import React from "react";

const Categorys = () => {
  const categories = [
    {
      id: 1,
      name: "Business Cards",
      description: "Professional cards for your brand",
      icon: "🪪",
      color: "bg-blue-50",
    },
    {
      id: 2,
      name: "Flyers & Leaflets",
      description: "Promote your business effectively",
      icon: "📄",
      color: "bg-yellow-50",
    },
    {
      id: 3,
      name: "Stickers",
      description: "Custom stickers for any purpose",
      icon: "🏷️",
      color: "bg-green-50",
    },
    {
      id: 4,
      name: "Banners & Signage",
      description: "Large format prints that stand out",
      icon: "🚩",
      color: "bg-red-50",
    },
    {
      id: 5,
      name: "Booklets",
      description: "Catalogs, magazines & booklets",
      icon: "📚",
      color: "bg-purple-50",
    },
  ];

  const router = useRouter();

  return (
    <div className="w-full py-16 grid place-items-center bg-gray-50">
      <div className="md:w-[80%] w-[90%]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Explore Our Products</h1>
          <p className="text-gray-500 mt-2">Over 50 products with low prices, delivered across Malaysia</p>
        </div>
        <div className="grid md:grid-cols-5 grid-cols-2 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`${category.color} cursor-pointer hover:scale-95 transition-all duration-300 rounded-xl p-5 flex flex-col gap-2`}
              onClick={() => router.push("/home/shop")}
            >
              <span className="text-4xl">{category.icon}</span>
              <h2 className="font-bold text-sm">{category.name}</h2>
              <p className="text-gray-500 text-xs">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categorys;