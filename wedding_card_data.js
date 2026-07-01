/**
 * Coded by Harith
 * Kampungcetak ®
 */
module.exports = {
  "prod-142": {
    _id: "prod-142",
    name: "Wedding Card",
    description: "High-quality Wedding Card with premium materials and vibrant printing. Perfect for your special day.",
    price: 88, // Pakej Simple (50 pcs) base price
    originalPrice: 150,
    discount: 41,
    rating: 4.9,
    reviews: 312,
    category: "kad-kahwin",
    images: ["/images/products/wedding_card.png"],
    colors: ["Standard"],
    sizes: ["Standard"],
    matrixPricing: {
      enabled: true,
      pricingData: [
        { material: "PAKEJ SIMPLE", laminate: "", quantityPrices: { "50": 88, "100": 129, "200": 188, "300": 288, "500": 388, "1000": 777 } },
        { material: "PAKEJ A", laminate: "", quantityPrices: { "50": 99, "100": 149, "200": 199, "300": 299, "500": 399, "1000": 799 } },
        { material: "PAKEJ B", laminate: "", quantityPrices: { "50": 119, "100": 159, "200": 210, "300": 310, "500": 410, "1000": 810 } },
        { material: "PAKEJ C", laminate: "", quantityPrices: { "50": 129, "100": 188, "200": 229, "300": 329, "500": 429, "1000": 829 } },
        { material: "PAKEJ D", laminate: "", quantityPrices: { "50": 139, "100": 199, "200": 249, "300": 349, "500": 449, "1000": 849 } },
        { material: "PAKEJ E", laminate: "", quantityPrices: { "50": 169, "100": 229, "200": 299, "300": 349, "500": 499, "1000": 799 } },
      ]
    },
    printingOptions: [
      {
        name: "Package",
        options: [
          { label: "PAKEJ SIMPLE", priceAdd: 0 },
          { label: "PAKEJ A", priceAdd: 0 },
          { label: "PAKEJ B", priceAdd: 0 },
          { label: "PAKEJ C", priceAdd: 0 },
          { label: "PAKEJ D", priceAdd: 0 },
          { label: "PAKEJ E", priceAdd: 0 },
        ],
      },
      {
        name: "Addons",
        isMultiSelect: true,
        options: [
          { label: "Bunting", priceAdd: 30 },
          { label: "Arrow Bunting", priceAdd: 10 },
          { label: "Banner", priceAdd: 40 },
          { label: "Sticker", priceAdd: 70 }, // User explicitly requested 70 for sticker
          { label: "Guestbook", priceAdd: 50 },
          { label: "Backdrop", priceAdd: 100 },
          { label: "Button Badge", priceAdd: 3 },
        ],
      }
    ],
  }
};
