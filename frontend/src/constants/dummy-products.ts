import { IProduct } from "@/types/IProduct";

export const dummyProducts: any[] = [
  {
    _id: "prod-100",
    name: "Banner",
    description:
      "High-quality Banner with premium materials and vibrant printing. Perfect for digital printing needs.",
    price: 21,
    originalPrice: 137,
    discount: 16,
    rating: 4.6,
    reviews: 40,
    category: "banner",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-101",
    name: "Bunting",
    description:
      "High-quality Bunting with premium materials and vibrant printing. Perfect for digital printing needs.",
    price: 53,
    originalPrice: 109,
    discount: 8,
    rating: 4.6,
    reviews: 312,
    category: "bunting",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-102",
    name: "Car Sticker",
    description:
      "High-quality Car Sticker with premium materials and vibrant printing. Perfect for digital printing needs.",
    price: 29,
    originalPrice: 160,
    discount: 21,
    rating: 3.8,
    reviews: 69,
    category: "car-sticker",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-103",
    name: "Board Printing",
    description:
      "High-quality Board Printing with premium materials and vibrant printing. Perfect for digital printing needs.",
    price: 29,
    originalPrice: 185,
    discount: 14,
    rating: 3.3,
    reviews: 45,
    category: "board-printing",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-104",
    name: "Wall Sticker",
    description:
      "High-quality Wall Sticker with premium materials and vibrant printing. Perfect for digital printing needs.",
    price: 84,
    originalPrice: 100,
    discount: 14,
    rating: 4.4,
    reviews: 289,
    category: "wall-sticker",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-105",
    name: "Glass Sticker",
    description:
      "High-quality Glass Sticker with premium materials and vibrant printing. Perfect for digital printing needs.",
    price: 80,
    originalPrice: 151,
    discount: 11,
    rating: 4.8,
    reviews: 266,
    category: "glass-sticker",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-106",
    name: "Personalised Flag",
    description:
      "High-quality Personalised Flag with premium materials and vibrant printing. Perfect for display item needs.",
    price: 16,
    originalPrice: 96,
    discount: 8,
    rating: 3.9,
    reviews: 28,
    category: "personalised-flag",
    images: ["/images/products/display_item.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-107",
    name: "Popup Backdrop Display",
    description:
      "High-quality Popup Backdrop Display with premium materials and vibrant printing. Perfect for display item needs.",
    price: 73,
    originalPrice: 137,
    discount: 20,
    rating: 4.9,
    reviews: 68,
    category: "popup-backdrop-display",
    images: ["/images/products/display_item.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-108",
    name: "Roll Up Stand",
    description:
      "High-quality Roll Up Stand with premium materials and vibrant printing. Perfect for display item needs.",
    price: 80,
    originalPrice: 103,
    discount: 24,
    rating: 3.4,
    reviews: 57,
    category: "roll-up-stand",
    images: ["/images/products/display_item.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-109",
    name: "Wind Flag",
    description:
      "High-quality Wind Flag with premium materials and vibrant printing. Perfect for display item needs.",
    price: 86,
    originalPrice: 144,
    discount: 22,
    rating: 3.6,
    reviews: 154,
    category: "wind-flag",
    images: ["/images/products/display_item.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-110",
      name: "Flyers",
      description:
        "High-quality Flyers with premium materials and vibrant printing. Perfect for digital offset needs.",
      price: 44,
      originalPrice: 155,
      discount: 17,
      rating: 4.1,
      reviews: 111,
      category: "flyers",
      images: ["/images/products/digital_offset.png"],
      colors: ["Red", "Blue", "Green", "Black", "White"],
      sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
      matrixPricing: {
        enabled: true,
        pricingData: [
        {
                "material": "80gsm Simili Paper",
                "laminate": "Single Side",
                "quantityPrices": {
                        "300": {
                                "A3": 219.6,
                                "A4": 115.6
                              },
                        "500": {
                                "A3": 233,
                                "A4": 127.2
                              },
                        "600": {
                                "A5": 100.2
                              },
                        "1000": {
                                "A3": 306.2,
                                "A4": 165.6,
                                "A5": 125.2
                              },
                        "2000": {
                                "A3": 450.6,
                                "A4": 205.8,
                                "A5": 184.8
                              },
                        "3000": {
                                "A3": 621,
                                "A4": 251
                              },
                        "4000": {
                                "A3": 791.2,
                                "A4": 335,
                                "A5": 238.8
                              },
                        "5000": {
                                "A3": 941.4,
                                "A4": 408.2
                              },
                        "6000": {
                                "A3": 1089.6,
                                "A4": 476.2,
                                "A5": 304.2
                              },
                        "7000": {
                                "A3": 1237.8,
                                "A4": 544.2
                              },
                        "8000": {
                                "A3": 1386,
                                "A4": 612.2,
                                "A5": 369.6
                              },
                        "9000": {
                                "A3": 1549.6,
                                "A4": 683.4
                              },
                        "10000": {
                                "A3": 1713.4,
                                "A4": 754.6,
                                "A5": 454.4
                              },
                        "12000": {
                                "A3": 2135.4,
                                "A4": 920.8,
                                "A5": 538.4
                              },
                        "14000": {
                                "A5": 622.4
                              },
                        "16000": {
                                "A3": 2823.6,
                                "A4": 1200,
                                "A5": 706.6
                              },
                        "18000": {
                                "A5": 747
                              },
                        "20000": {
                                "A3": 3486.8,
                                "A4": 1436,
                                "A5": 787.4
                              },
                        "24000": {
                                "A3": 3881.6,
                                "A4": 1703.8
                              },
                        "28000": {
                                "A3": 4479.6,
                                "A4": 1973.6
                              },
                        "30000": {
                                "A3": 4792.4,
                                "A4": 2046.8
                              },
                        "32000": {
                                "A3": 5105.4,
                                "A4": 2181.6
                              },
                        "36000": {
                                "A3": 5731.2,
                                "A4": 2449.2
                              },
                        "40000": {
                                "A3": 6356.8,
                                "A4": 2717,
                                "A5": 1544
                              },
                        "60000": {
                                "A5": 2405
                              },
                        "100000": {
                                "A5": 3690
                              },
                        "200000": {
                                "A5": 7358.8
                              }
                      }
              },
        {
                "material": "80gsm Simili Paper",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "300": {
                                "A3": 354.2,
                                "A4": 198.4
                              },
                        "500": {
                                "A3": 371.6,
                                "A4": 208
                              },
                        "600": {
                                "A5": 173.4
                              },
                        "1000": {
                                "A3": 427.4,
                                "A4": 227.2,
                                "A5": 213.8
                              },
                        "2000": {
                                "A3": 562.2,
                                "A4": 312,
                                "A5": 231
                              },
                        "3000": {
                                "A3": 714.2,
                                "A4": 363
                              },
                        "4000": {
                                "A3": 866.4,
                                "A4": 414,
                                "A5": 315.8
                              },
                        "5000": {
                                "A3": 985.6,
                                "A4": 500.6
                              },
                        "6000": {
                                "A3": 1132,
                                "A4": 580.2,
                                "A5": 387
                              },
                        "7000": {
                                "A3": 1278.2,
                                "A4": 659.6
                              },
                        "8000": {
                                "A3": 1424.6,
                                "A4": 739.2,
                                "A5": 458.2
                              },
                        "9000": {
                                "A3": 1555.4,
                                "A4": 822
                              },
                        "10000": {
                                "A3": 1686.4,
                                "A4": 904.8,
                                "A5": 539
                              },
                        "12000": {
                                "A3": 2016.6,
                                "A4": 1072.4,
                                "A5": 636.6
                              },
                        "14000": {
                                "A5": 734.2
                              },
                        "16000": {
                                "A3": 2648.6,
                                "A4": 1420,
                                "A5": 831.6
                              },
                        "18000": {
                                "A5": 883
                              },
                        "20000": {
                                "A3": 2954.4,
                                "A4": 1760,
                                "A5": 924
                              },
                        "24000": {
                                "A3": 3663.8,
                                "A4": 1918
                              },
                        "28000": {
                                "A3": 4188.6,
                                "A4": 2262.2
                              },
                        "30000": {
                                "A3": 4478.8,
                                "A4": 2419
                              },
                        "32000": {
                                "A3": 4769,
                                "A4": 2574
                              },
                        "36000": {
                                "A3": 5349.2,
                                "A4": 2890
                              },
                        "40000": {
                                "A3": 5929.4,
                                "A4": 3204,
                                "A5": 1800
                              },
                        "60000": {
                                "A5": 2797.4
                              },
                        "100000": {
                                "A5": 4108.2
                              },
                        "200000": {
                                "A5": 8187.8
                              }
                      }
              },
        {
                "material": "100gsm Simili Paper",
                "laminate": "Single Side",
                "quantityPrices": {
                        "300": {
                                "A4": 150.2
                              },
                        "500": {
                                "A4": 158
                              },
                        "1000": {
                                "A4": 208
                              },
                        "2000": {
                                "A4": 263.8
                              },
                        "3000": {
                                "A4": 352.4
                              },
                        "4000": {
                                "A4": 440.8
                              },
                        "5000": {
                                "A4": 523.6
                              },
                        "6000": {
                                "A4": 606.4
                              },
                        "7000": {
                                "A4": 689.2
                              },
                        "8000": {
                                "A4": 772
                              },
                        "9000": {
                                "A4": 847
                              },
                        "10000": {
                                "A4": 922.2
                              },
                        "12000": {
                                "A4": 1093.4
                              },
                        "16000": {
                                "A4": 1445.8
                              },
                        "20000": {
                                "A4": 1615.2
                              },
                        "24000": {
                                "A4": 2018.6
                              },
                        "28000": {
                                "A4": 2348.6
                              },
                        "30000": {
                                "A4": 2511.6
                              },
                        "32000": {
                                "A4": 2678.8
                              },
                        "36000": {
                                "A4": 3006.8
                              },
                        "40000": {
                                "A4": 3336.8
                              }
                      }
              },
        {
                "material": "100gsm Simili Paper",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "300": {
                                "A4": 223.4
                              },
                        "500": {
                                "A4": 231
                              },
                        "1000": {
                                "A4": 254.2
                              },
                        "2000": {
                                "A4": 348.6
                              },
                        "3000": {
                                "A4": 425.6
                              },
                        "4000": {
                                "A4": 502.6
                              },
                        "5000": {
                                "A4": 606.4
                              },
                        "6000": {
                                "A4": 716.2
                              },
                        "7000": {
                                "A4": 826
                              },
                        "8000": {
                                "A4": 935.6
                              },
                        "9000": {
                                "A4": 1026.2
                              },
                        "10000": {
                                "A4": 1116.6
                              },
                        "12000": {
                                "A4": 1375.6
                              },
                        "16000": {
                                "A4": 1749.2
                              },
                        "20000": {
                                "A4": 2134
                              },
                        "24000": {
                                "A4": 2494.4
                              },
                        "28000": {
                                "A4": 2853
                              },
                        "30000": {
                                "A4": 3103.8
                              },
                        "32000": {
                                "A4": 3215.2
                              },
                        "36000": {
                                "A4": 3566.2
                              },
                        "40000": {
                                "A4": 3919
                              }
                      }
              },
        {
                "material": "85gsm Art Paper",
                "laminate": "Single Side",
                "quantityPrices": {
                        "300": {
                                "A4": 136.8
                              },
                        "500": {
                                "A4": 144.4
                              },
                        "1000": {
                                "A4": 190.6
                              },
                        "2000": {
                                "A4": 248.4
                              },
                        "4000": {
                                "A4": 392.8
                              },
                        "5000": {
                                "A4": 477.4
                              },
                        "8000": {
                                "A4": 700.8
                              },
                        "10000": {
                                "A4": 831.6
                              },
                        "12000": {
                                "A4": 989.6
                              },
                        "15000": {
                                "A4": 1226.4
                              },
                        "16000": {
                                "A4": 1307.2
                              },
                        "20000": {
                                "A4": 1466.8
                              },
                        "24000": {
                                "A4": 1750.6
                              },
                        "25000": {
                                "A4": 1822
                              },
                        "28000": {
                                "A4": 2123.2
                              },
                        "30000": {
                                "A4": 2272.2
                              },
                        "32000": {
                                "A4": 2423.2
                              },
                        "35000": {
                                "A4": 2644.6
                              },
                        "36000": {
                                "A4": 2717
                              },
                        "40000": {
                                "A4": 3016.8
                              }
                      }
              },
        {
                "material": "85gsm Art Paper",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "105": {
                                "A3": 4
                              },
                        "300": {
                                "A4": 948.6
                              },
                        "500": {
                                "A4": 1385
                              },
                        "1000": {
                                "A4": 1576.6
                              },
                        "2000": {
                                "A4": 1883.6
                              },
                        "4000": {
                                "A4": 2251.6
                              },
                        "5000": {
                                "A4": 2617.8
                              },
                        "8000": {
                                "A4": 2868.8
                              },
                        "10000": {
                                "A4": 3220.6
                              },
                        "12000": {
                                "A4": 3570.8
                              }
                      }
              },
        {
                "material": "105gsm Art Paper",
                "laminate": "Single Side",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 213.8,
                                "A4": 136.8
                              },
                        "500": {
                                "A3": 223.4,
                                "A4": 144.4
                              },
                        "1000": {
                                "A3": 290.8,
                                "A4": 190.6
                              },
                        "2000": {
                                "A3": 423.6,
                                "A4": 248.4
                              },
                        "4000": {
                                "A3": 720,
                                "A4": 392.8
                              },
                        "5000": {
                                "A3": 885.6,
                                "A4": 477.4
                              },
                        "8000": {
                                "A3": 1345.6,
                                "A4": 700.8
                              },
                        "10000": {
                                "A3": 1663.2,
                                "A4": 831.6
                              },
                        "12000": {
                                "A3": 2073,
                                "A4": 989.6
                              },
                        "15000": {
                                "A3": 2576,
                                "A4": 1226.4
                              },
                        "16000": {
                                "A3": 2741,
                                "A4": 1307.2
                              },
                        "20000": {
                                "A3": 3067.2,
                                "A4": 1466.8
                              },
                        "24000": {
                                "A3": 3678.2,
                                "A4": 1750.6
                              },
                        "25000": {
                                "A3": 3827.4,
                                "A4": 1822
                              },
                        "28000": {
                                "A3": 4242.4,
                                "A4": 2123.2
                              },
                        "30000": {
                                "A3": 4538.4,
                                "A4": 2272.2
                              },
                        "32000": {
                                "A3": 4834.4,
                                "A4": 2423.2
                              },
                        "35000": {
                                "A3": 5278.4,
                                "A4": 2644.6
                              },
                        "36000": {
                                "A3": 5426.4,
                                "A4": 2717
                              },
                        "40000": {
                                "A3": 6018.4,
                                "A4": 3016.8
                              }
                      }
              },
        {
                "material": "105gsm Art Paper",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 367.8,
                                "A4": 211.8
                              },
                        "500": {
                                "A3": 381.2,
                                "A4": 227.2
                              },
                        "1000": {
                                "A3": 440.8,
                                "A4": 244.6
                              },
                        "2000": {
                                "A3": 620,
                                "A4": 321.6
                              },
                        "4000": {
                                "A3": 935.6,
                                "A4": 473.6
                              },
                        "5000": {
                                "A3": 1135.8,
                                "A4": 573.8
                              },
                        "8000": {
                                "A3": 1651.8,
                                "A4": 885.6
                              },
                        "10000": {
                                "A3": 2054.8,
                                "A4": 1055
                              },
                        "12000": {
                                "A3": 2443.2,
                                "A4": 1247.4
                              },
                        "15000": {
                                "A3": 3020.8,
                                "A4": 1542
                              },
                        "16000": {
                                "A3": 3212,
                                "A4": 1640.2
                              },
                        "20000": {
                                "A3": 3461.6,
                                "A4": 1767.2
                              },
                        "24000": {
                                "A3": 4184,
                                "A4": 2129.4
                              },
                        "25000": {
                                "A3": 4352.8,
                                "A4": 2211.8
                              },
                        "28000": {
                                "A3": 4794.6,
                                "A4": 2471.4
                              },
                        "30000": {
                                "A3": 5127.6,
                                "A4": 2644.6
                              },
                        "32000": {
                                "A3": 5460.4,
                                "A4": 2815.6
                              },
                        "35000": {
                                "A3": 5960,
                                "A4": 3075.2
                              },
                        "36000": {
                                "A3": 6126.4,
                                "A4": 3157.6
                              },
                        "40000": {
                                "A3": 6792.4,
                                "A4": 3377
                              }
                      }
              },
        {
                "material": "128gsm Art Paper",
                "laminate": "Single Side",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A4": 158
                              },
                        "500": {
                                "A4": 163.8
                              },
                        "600": {
                                "A5": 600
                              },
                        "1000": {
                                "A4": 219.6,
                                "A5": 1000
                              },
                        "2000": {
                                "A4": 277.2,
                                "A5": 2000
                              },
                        "3000": {
                                "A4": 367.8
                              },
                        "4000": {
                                "A4": 458.2,
                                "A5": 4000
                              },
                        "5000": {
                                "A4": 558.4
                              },
                        "6000": {
                                "A4": 646.8,
                                "A5": 6000
                              },
                        "7000": {
                                "A4": 735.4
                              },
                        "8000": {
                                "A4": 824,
                                "A5": 8000
                              },
                        "9000": {
                                "A4": 902.8
                              },
                        "10000": {
                                "A4": 981.8,
                                "A5": 10000
                              },
                        "12000": {
                                "A4": 1170.4,
                                "A5": 12000
                              },
                        "14000": {
                                "A5": 14000
                              },
                        "16000": {
                                "A4": 1556,
                                "A5": 16000
                              },
                        "18000": {
                                "A5": 18000
                              },
                        "20000": {
                                "A4": 1824.6,
                                "A5": 20000
                              },
                        "24000": {
                                "A4": 2165.6
                              },
                        "28000": {
                                "A4": 2517.8
                              },
                        "30000": {
                                "A4": 2698.8
                              },
                        "32000": {
                                "A4": 2872
                              },
                        "36000": {
                                "A4": 3226.2
                              },
                        "40000": {
                                "A4": 3580.2,
                                "A5": 40000
                              },
                        "44000": {
                                "A4": 3995.4
                              },
                        "45000": {
                                "A4": 4085
                              },
                        "50000": {
                                "A4": 4533.6
                              },
                        "52000": {
                                "A4": 4712.8
                              },
                        "56000": {
                                "A4": 5071.6
                              },
                        "60000": {
                                "A4": 5430.4,
                                "A5": 60000
                              },
                        "64000": {
                                "A4": 5789.2
                              },
                        "68000": {
                                "A4": 6148
                              },
                        "70000": {
                                "A4": 6327.4
                              },
                        "72000": {
                                "A4": 6506.6
                              },
                        "76000": {
                                "A4": 6865.4
                              },
                        "80000": {
                                "A4": 7224.2
                              },
                        "84000": {
                                "A4": 7583
                              },
                        "88000": {
                                "A4": 7941.8
                              },
                        "90000": {
                                "A4": 8121
                              },
                        "92000": {
                                "A4": 8300.4
                              },
                        "96000": {
                                "A4": 8659.2
                              },
                        "100000": {
                                "A4": 9018,
                                "A5": 100000
                              },
                        "200000": {
                                "A5": 200000
                              }
                      }
              },
        {
                "material": "128gsm Art Paper",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "157": {
                                "A3": 4
                              },
                        "300": {
                                "A4": 225.4
                              },
                        "500": {
                                "A4": 246.4
                              },
                        "600": {
                                "A5": 240.8
                              },
                        "1000": {
                                "A4": 267.6,
                                "A5": 267.6
                              },
                        "2000": {
                                "A4": 354.2,
                                "A5": 379.4
                              },
                        "3000": {
                                "A4": 439.8
                              },
                        "4000": {
                                "A4": 525.6,
                                "A5": 466
                              },
                        "5000": {
                                "A4": 623.8
                              },
                        "6000": {
                                "A4": 746.4,
                                "A5": 552.6
                              },
                        "7000": {
                                "A4": 869
                              },
                        "8000": {
                                "A4": 991.4,
                                "A5": 658.4
                              },
                        "9000": {
                                "A4": 1078
                              },
                        "10000": {
                                "A4": 1190,
                                "A5": 774
                              },
                        "12000": {
                                "A4": 1338,
                                "A5": 889.4
                              },
                        "14000": {
                                "A5": 1005
                              },
                        "16000": {
                                "A4": 1760,
                                "A5": 1062
                              },
                        "18000": {
                                "A5": 1123
                              },
                        "20000": {
                                "A4": 2154.8,
                                "A5": 2217.8
                              },
                        "24000": {
                                "A4": 2568
                              },
                        "28000": {
                                "A4": 2878
                              },
                        "30000": {
                                "A4": 3077.2
                              },
                        "32000": {
                                "A4": 3278.4
                              },
                        "36000": {
                                "A4": 3677
                              },
                        "40000": {
                                "A4": 4079.4,
                                "A5": 3302.6
                              },
                        "44000": {
                                "A4": 4372.2
                              },
                        "45000": {
                                "A4": 4470
                              },
                        "50000": {
                                "A4": 4959.6
                              },
                        "52000": {
                                "A4": 5155.4
                              },
                        "56000": {
                                "A4": 5547
                              },
                        "60000": {
                                "A4": 5938.6,
                                "A5": 5257.4
                              },
                        "64000": {
                                "A4": 6330.2
                              },
                        "68000": {
                                "A4": 6721.8
                              },
                        "70000": {
                                "A4": 6917.6
                              },
                        "72000": {
                                "A4": 7113.4
                              },
                        "76000": {
                                "A4": 7505
                              },
                        "80000": {
                                "A4": 7896.6
                              },
                        "84000": {
                                "A4": 8288.2
                              },
                        "88000": {
                                "A4": 8679.8
                              },
                        "90000": {
                                "A4": 8875.6
                              },
                        "92000": {
                                "A4": 9071.4
                              },
                        "96000": {
                                "A4": 9463.2
                              },
                        "100000": {
                                "A4": 9854.8,
                                "A5": 10482.4
                              }
                      }
              },
        {
                "material": "157gsm Art Paper",
                "laminate": "Single Side",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 248.4,
                                "A4": 184.8
                              },
                        "500": {
                                "A3": 263.8,
                                "A4": 192.6
                              },
                        "600": {
                                "A5": 600
                              },
                        "1000": {
                                "A3": 354.2,
                                "A4": 240.8,
                                "A5": 1000
                              },
                        "2000": {
                                "A3": 546.8,
                                "A4": 304.2,
                                "A5": 2000
                              },
                        "3000": {
                                "A3": 745,
                                "A4": 406.2
                              },
                        "4000": {
                                "A3": 943.4,
                                "A4": 508.2,
                                "A5": 4000
                              },
                        "5000": {
                                "A3": 1164.8,
                                "A4": 604.6
                              },
                        "6000": {
                                "A3": 1371.4,
                                "A4": 711.6,
                                "A5": 6000
                              },
                        "7000": {
                                "A3": 1577.8,
                                "A4": 818.8
                              },
                        "8000": {
                                "A3": 1784.6,
                                "A4": 926,
                                "A5": 8000
                              },
                        "9000": {
                                "A3": 2000,
                                "A4": 1034.8
                              },
                        "10000": {
                                "A3": 2210,
                                "A4": 1143.6,
                                "A5": 10000
                              },
                        "12000": {
                                "A3": 2640,
                                "A4": 1364.8,
                                "A5": 12000
                              },
                        "14000": {
                                "A5": 14000
                              },
                        "16000": {
                                "A3": 3500,
                                "A4": 1805.8,
                                "A5": 16000
                              },
                        "18000": {
                                "A5": 18000
                              },
                        "20000": {
                                "A3": 4101.6,
                                "A4": 2113.2,
                                "A5": 20000
                              },
                        "24000": {
                                "A3": 5081,
                                "A4": 2529.8
                              },
                        "28000": {
                                "A3": 5876.2,
                                "A4": 2942.4
                              },
                        "30000": {
                                "A3": 6287.6,
                                "A4": 3151.6
                              },
                        "32000": {
                                "A3": 6699,
                                "A4": 3359
                              },
                        "36000": {
                                "A3": 7522,
                                "A4": 3771.6
                              },
                        "40000": {
                                "A3": 8344.8,
                                "A4": 4186,
                                "A5": 40000
                              },
                        "44000": {
                                "A3": 9167.8,
                                "A4": 4691.4
                              },
                        "45000": {
                                "A4": 5113.2
                              },
                        "48000": {
                                "A3": 9990.8
                              },
                        "50000": {
                                "A3": 10402.2,
                                "A4": 5324
                              },
                        "52000": {
                                "A3": 10813.6,
                                "A4": 5534.8
                              },
                        "56000": {
                                "A3": 11636.6,
                                "A4": 5956.4
                              },
                        "60000": {
                                "A3": 12459.4,
                                "A4": 6378,
                                "A5": 60000
                              },
                        "64000": {
                                "A3": 13282.4,
                                "A4": 6799.6
                              },
                        "68000": {
                                "A3": 14105.2,
                                "A4": 7221.2
                              },
                        "70000": {
                                "A3": 14516.8,
                                "A4": 7432
                              },
                        "72000": {
                                "A3": 14928.2,
                                "A4": 7642.8
                              },
                        "76000": {
                                "A3": 15751,
                                "A4": 8064.4
                              },
                        "80000": {
                                "A3": 16574,
                                "A4": 8486
                              },
                        "84000": {
                                "A3": 17396.8,
                                "A4": 8907.6
                              },
                        "88000": {
                                "A3": 18219.8,
                                "A4": 9329.2
                              },
                        "90000": {
                                "A3": 18631.2,
                                "A4": 9540
                              },
                        "92000": {
                                "A3": 19042.8,
                                "A4": 9750.8
                              },
                        "96000": {
                                "A3": 19865.6,
                                "A4": 10172.4
                              },
                        "100000": {
                                "A3": 20688.6,
                                "A4": 10594,
                                "A5": 100000
                              },
                        "200000": {
                                "A5": 200000
                              }
                      }
              },
        {
                "material": "157gsm Art Paper",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "300": {
                                "A3": 410,
                                "A4": 231
                              },
                        "500": {
                                "A3": 419.8,
                                "A4": 254.2
                              },
                        "600": {
                                "A5": 156
                              },
                        "1000": {
                                "A3": 525.6,
                                "A4": 281.2,
                                "A5": 190.6
                              },
                        "2000": {
                                "A3": 745,
                                "A4": 379.4,
                                "A5": 233
                              },
                        "3000": {
                                "A3": 925,
                                "A4": 478.4
                              },
                        "4000": {
                                "A3": 1105,
                                "A4": 577.6,
                                "A5": 321.6
                              },
                        "5000": {
                                "A3": 1351.4,
                                "A4": 679.6
                              },
                        "6000": {
                                "A3": 1614.8,
                                "A4": 805.4,
                                "A5": 432.2
                              },
                        "7000": {
                                "A3": 1878,
                                "A4": 932.4
                              },
                        "8000": {
                                "A3": 2141.4,
                                "A4": 1058.8,
                                "A5": 543
                              },
                        "9000": {
                                "A3": 2299.4,
                                "A4": 1182
                              },
                        "10000": {
                                "A3": 2457.4,
                                "A4": 1305.2,
                                "A5": 646.8
                              },
                        "12000": {
                                "A3": 2924.2,
                                "A4": 1551.6,
                                "A5": 760
                              },
                        "14000": {
                                "A5": 871.4
                              },
                        "16000": {
                                "A3": 3860,
                                "A4": 2141.4,
                                "A5": 983.8
                              },
                        "18000": {
                                "A5": 1041.6
                              },
                        "20000": {
                                "A3": 4317,
                                "A4": 2407.6,
                                "A5": 1120
                              },
                        "24000": {
                                "A3": 5586.8,
                                "A4": 2855.8
                              },
                        "28000": {
                                "A3": 6428.2,
                                "A4": 3322.8
                              },
                        "30000": {
                                "A3": 6876.6,
                                "A4": 3556.2
                              },
                        "32000": {
                                "A3": 7325,
                                "A4": 3652.8
                              },
                        "36000": {
                                "A3": 8222,
                                "A4": 4099.6
                              },
                        "40000": {
                                "A3": 9118.8,
                                "A4": 4546.2,
                                "A5": 2250
                              },
                        "44000": {
                                "A3": 10015.6,
                                "A4": 5068.2
                              },
                        "45000": {
                                "A4": 5522.8
                              },
                        "48000": {
                                "A3": 10912.4
                              },
                        "50000": {
                                "A3": 11360.8,
                                "A4": 5750
                              },
                        "52000": {
                                "A3": 11809.2,
                                "A4": 5977.2
                              },
                        "56000": {
                                "A3": 12706,
                                "A4": 6431.6
                              },
                        "60000": {
                                "A3": 13602.8,
                                "A4": 6886.2,
                                "A5": 3308.4
                              },
                        "64000": {
                                "A3": 14499.8,
                                "A4": 7340.6
                              },
                        "68000": {
                                "A3": 15396.6,
                                "A4": 7795
                              },
                        "70000": {
                                "A3": 15845,
                                "A4": 8022.4
                              },
                        "72000": {
                                "A3": 16293.4,
                                "A4": 8249.6
                              },
                        "76000": {
                                "A3": 17190.2,
                                "A4": 8704
                              },
                        "80000": {
                                "A3": 18087,
                                "A4": 9158.4
                              },
                        "84000": {
                                "A3": 18983.8,
                                "A4": 9613
                              },
                        "88000": {
                                "A3": 19880.6,
                                "A4": 10067.4
                              },
                        "90000": {
                                "A3": 20329.2,
                                "A4": 10294.6
                              },
                        "92000": {
                                "A3": 20777.6,
                                "A4": 10521.8
                              },
                        "96000": {
                                "A3": 21674.4,
                                "A4": 10976.4
                              },
                        "100000": {
                                "A3": 22571.2,
                                "A4": 11430.8,
                                "A5": 5627
                              },
                        "200000": {
                                "A5": 11227.2
                              }
                      }
              },
        {
                "material": "260gsm Art Card",
                "laminate": "Single Side",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 398.6,
                                "A4": 300
                              },
                        "500": {
                                "A3": 446.6,
                                "A4": 500
                              },
                        "1000": {
                                "A3": 618,
                                "A4": 1000
                              },
                        "2000": {
                                "A3": 964.6,
                                "A4": 2000
                              },
                        "3000": {
                                "A3": 1407.2,
                                "A4": 3000
                              },
                        "4000": {
                                "A3": 1850,
                                "A4": 4000
                              },
                        "5000": {
                                "A3": 2399,
                                "A4": 5000
                              },
                        "6000": {
                                "A3": 2868.6,
                                "A4": 6000
                              },
                        "7000": {
                                "A3": 3299.2,
                                "A4": 7000
                              },
                        "8000": {
                                "A3": 3731.6,
                                "A4": 8000
                              },
                        "9000": {
                                "A3": 4165.8,
                                "A4": 9000
                              },
                        "10000": {
                                "A3": 4596.4,
                                "A4": 10000
                              }
                      }
              },
        {
                "material": "260gsm Art Card",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 591,
                                "A4": 256
                              },
                        "500": {
                                "A3": 654.6,
                                "A4": 271.6
                              },
                        "1000": {
                                "A3": 806.6,
                                "A4": 389
                              },
                        "2000": {
                                "A3": 1126.2,
                                "A4": 519.8
                              },
                        "3000": {
                                "A3": 1507.4,
                                "A4": 737
                              },
                        "4000": {
                                "A3": 2056.8,
                                "A4": 981.8
                              },
                        "5000": {
                                "A3": 2539.8,
                                "A4": 1188
                              },
                        "6000": {
                                "A3": 3071.2,
                                "A4": 1425.6
                              },
                        "7000": {
                                "A3": 3560.2,
                                "A4": 1663.2
                              },
                        "8000": {
                                "A3": 4053.2,
                                "A4": 1900.8
                              },
                        "9000": {
                                "A3": 4542.2,
                                "A4": 2138.4
                              },
                        "10000": {
                                "A3": 5031.4,
                                "A4": 2376
                              }
                      }
              },
        {
                "material": "310gsm Art Card",
                "laminate": "Single Side",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 478.4,
                                "A4": 307.2
                              },
                        "500": {
                                "A3": 536,
                                "A4": 326
                              },
                        "1000": {
                                "A3": 741.6,
                                "A4": 466.8
                              },
                        "2000": {
                                "A3": 1157.6,
                                "A4": 623.8
                              },
                        "3000": {
                                "A3": 1688.8,
                                "A4": 884.4
                              },
                        "4000": {
                                "A3": 2220,
                                "A4": 1178.2
                              },
                        "5000": {
                                "A3": 2878.8,
                                "A4": 1425.6
                              },
                        "6000": {
                                "A3": 3442.4,
                                "A4": 1710.8
                              },
                        "7000": {
                                "A3": 3959.2,
                                "A4": 1996
                              },
                        "8000": {
                                "A3": 4478,
                                "A4": 2281
                              },
                        "9000": {
                                "A3": 4999,
                                "A4": 2566.2
                              },
                        "10000": {
                                "A3": 5515.8,
                                "A4": 2851.2
                              }
                      }
              },
        {
                "material": "310gsm Art Card",
                "laminate": "Front and Back",
                "quantityPrices": {
                        "4": {
                                "A5": 4
                              },
                        "300": {
                                "A3": 709.2,
                                "A4": 397.6
                              },
                        "500": {
                                "A3": 785.6,
                                "A4": 423
                              },
                        "1000": {
                                "A3": 968,
                                "A4": 510.8
                              },
                        "2000": {
                                "A3": 1351.6,
                                "A4": 788.2
                              },
                        "3000": {
                                "A3": 1809,
                                "A4": 1009.8
                              },
                        "4000": {
                                "A3": 2468.2,
                                "A4": 1222.2
                              },
                        "5000": {
                                "A3": 3047.8,
                                "A4": 1504
                              },
                        "6000": {
                                "A3": 3685.6,
                                "A4": 1804.8
                              },
                        "7000": {
                                "A3": 4272.4,
                                "A4": 2105.4
                              },
                        "8000": {
                                "A3": 4864,
                                "A4": 2406.2
                              },
                        "9000": {
                                "A3": 5450.8,
                                "A4": 2707
                              },
                        "10000": {
                                "A3": 6037.8,
                                "A4": 3007.8
                              }
                      }
              }
]
      },
      printingOptions: [
        {
          name: "Material",
          options: [
            { label: "80gsm Simili Paper", priceAdd: 0 },
            { label: "100gsm Simili Paper", priceAdd: 0 },
            { label: "85gsm Art Paper", priceAdd: 0 },
            { label: "105gsm Art Paper", priceAdd: 0 },
            { label: "128gsm Art Paper", priceAdd: 0 },
            { label: "157gsm Art Paper", priceAdd: 0 },
            { label: "260gsm Art Card", priceAdd: 0 },
            { label: "310gsm Art Card", priceAdd: 0 }
          ]
        },
        {
          name: "Printing Sides",
          options: [
            { label: "Single Side", priceAdd: 0 },
            { label: "Front and Back", priceAdd: 0 }
          ]
        }
      ]
  },
  {
    _id: "prod-111",
    name: "Booklet",
    description:
      "High-quality Booklet with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 88,
    originalPrice: 108,
    discount: 21,
    rating: 4.9,
    reviews: 91,
    category: "booklet",
    images: ["/images/products/digital_offset.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-112",
    name: "Business Card",
    description:
      "High-quality Business Card with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 86,
    originalPrice: 121,
    discount: 18,
    rating: 4.6,
    reviews: 175,
    category: "business-card",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    matrixPricing: {
      enabled: true,
      pricingData: [
        {
          laminate: "MATT LAMINATE",
          material: "260GSM",
          quantityPrices: {
            "100": 22,
            "200": 30,
            "300": 32,
            "400": 38,
            "500": 43,
            "1000": 55,
            "2000": 110,
          },
        },
        {
          laminate: "MATT LAMINATE",
          material: "310GSM",
          quantityPrices: {
            "100": 30,
            "200": 40,
            "300": 50,
            "400": 55,
            "500": 60,
            "1000": 70,
            "2000": 125,
          },
        },
        {
          laminate: "MATT LAMINATE",
          material: "350GSM",
          quantityPrices: {
            "100": 30,
            "200": 44,
            "300": 57,
            "400": 72,
            "500": 82,
            "1000": 150,
            "2000": 300,
          },
        },
        {
          laminate: "NO LAMINATE",
          material: "260GSM",
          quantityPrices: {
            "100": 15,
            "200": 23,
            "300": 27,
            "500": 35,
            "1000": 50,
            "2000": 95,
          },
        },
        {
          laminate: "MATT LAM 1SIDE SPOT UV",
          material: "260GSM",
          quantityPrices: {
            "100": 40,
            "200": 45,
            "300": 50,
            "400": 60,
            "500": 65,
            "1000": 100,
            "2000": 180,
          },
        },
        {
          laminate: "MATT LAM 2 SIDE SPOT UV",
          material: "260GSM",
          quantityPrices: {
            "200": 65,
            "300": 70,
            "500": 85,
            "1000": 120,
            "2000": 230,
          },
        },
        {
          laminate: "MATT LAM 1SIDE SPOT UV",
          material: "310GSM",
          quantityPrices: {
            "300": 55,
            "500": 65,
            "1000": 95,
            "2000": 175,
          },
        },
        {
          laminate: "MATT LAM 2 SIDE SPOT UV",
          material: "310GSM",
          quantityPrices: {
            "300": 55,
            "500": 95,
            "1000": 145,
            "2000": 290,
          },
        },
        {
          laminate: "MATT LAM 1SIDE SPOT UV",
          material: "350GSM",
          quantityPrices: {
            "300": 65,
            "500": 110,
            "1000": 199,
            "2000": 360,
          },
        },
        {
          laminate: "MATT LAM 2 SIDE SPOT UV",
          material: "350GSM",
          quantityPrices: {
            "300": 75,
            "500": 120,
            "1000": 240,
            "2000": 500,
          },
        },
      ],
    },
    printingOptions: [
      {
        name: "Material",
        options: [
          {
            label: "260GSM",
            priceAdd: 0,
          },
          {
            label: "310GSM",
            priceAdd: 0,
          },
          {
            label: "350GSM",
            priceAdd: 0,
          },
        ],
      },
      {
        name: "Lamination & Finish",
        options: [
          {
            label: "MATT LAMINATE",
            priceAdd: 0,
          },
          {
            label: "NO LAMINATE",
            priceAdd: 0,
          },
          {
            label: "UV VARNISH",
            priceAdd: 0,
          },
          {
            label: "MATT LAM 1SIDE SPOT UV",
            priceAdd: 0,
          },
          {
            label: "MATT LAM 2 SIDE SPOT UV",
            priceAdd: 0,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-113",
    name: "Corporate Folder",
    description:
      "High-quality Corporate Folder with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 42,
    originalPrice: 167,
    discount: 23,
    rating: 4.1,
    reviews: 110,
    category: "corporate-folder",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-114",
    name: "Paper Bag",
    description:
      "High-quality Paper Bag with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 67,
    originalPrice: 188,
    discount: 6,
    rating: 3.4,
    reviews: 129,
    category: "paper-bag",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-115",
    name: "Certificate",
    description:
      "High-quality Certificate with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 63,
    originalPrice: 151,
    discount: 9,
    rating: 3.9,
    reviews: 118,
    category: "certificate",
    images: ["/images/products/digital_offset.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-116",
    name: "Stamp",
    description:
      "High-quality Stamp with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 17,
    originalPrice: 147,
    discount: 11,
    rating: 3.7,
    reviews: 74,
    category: "stamp",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-117",
    name: "Sticker",
    description:
      "High-quality Sticker with premium materials and vibrant printing. Perfect for digital offset needs.",
    price: 24,
    originalPrice: 179,
    discount: 18,
    rating: 3.4,
    reviews: 53,
    category: "sticker",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-118",
    name: "Crystal Plaque Trophy",
    description:
      "High-quality Crystal Plaque Trophy with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 38,
    originalPrice: 94,
    discount: 24,
    rating: 5,
    reviews: 296,
    category: "crystal-plaque-trophy",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-119",
    name: "Acrylic Trophy",
    description:
      "High-quality Acrylic Trophy with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 62,
    originalPrice: 158,
    discount: 11,
    rating: 4.4,
    reviews: 34,
    category: "acrylic-trophy",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-120",
    name: "Acrylic Keychain",
    description:
      "High-quality Acrylic Keychain with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 67,
    originalPrice: 102,
    discount: 20,
    rating: 4,
    reviews: 235,
    category: "acrylic-keychain",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-121",
    name: "Fridge Magnet",
    description:
      "High-quality Fridge Magnet with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 68,
    originalPrice: 115,
    discount: 17,
    rating: 4.2,
    reviews: 193,
    category: "fridge-magnet",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-122",
    name: "Lanyard",
    description:
      "High-quality Lanyard with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 47,
    originalPrice: 189,
    discount: 8,
    rating: 3.6,
    reviews: 195,
    category: "lanyard",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-123",
    name: "Mug",
    description:
      "High-quality Mug with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 33,
    originalPrice: 115,
    discount: 21,
    rating: 4.8,
    reviews: 178,
    category: "mug",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-124",
    name: "Pen",
    description:
      "High-quality Pen with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 66,
    originalPrice: 183,
    discount: 22,
    rating: 4.3,
    reviews: 73,
    category: "pen",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-125",
    name: "Calendar",
    description:
      "High-quality Calendar with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 76,
    originalPrice: 143,
    discount: 15,
    rating: 4.9,
    reviews: 114,
    category: "calendar",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-126",
    name: "Notebook",
    description:
      "High-quality Notebook with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 50,
    originalPrice: 165,
    discount: 20,
    rating: 3.7,
    reviews: 189,
    category: "notebook",
    images: ["/images/products/corporate_gift.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-127",
    name: "Money Packet",
    description:
      "High-quality Money Packet with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 19,
    originalPrice: 121,
    discount: 19,
    rating: 4.3,
    reviews: 245,
    category: "money-packet",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-128",
    name: "Premium Gift",
    description:
      "High-quality Premium Gift with premium materials and vibrant printing. Perfect for corporate gift needs.",
    price: 20,
    originalPrice: 91,
    discount: 16,
    rating: 3.8,
    reviews: 28,
    category: "premium-gift",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-129",
    name: "Non Woven Bag",
    description:
      "High-quality Non Woven Bag with premium materials and vibrant printing. Perfect for apparel needs.",
    price: 47,
    originalPrice: 178,
    discount: 18,
    rating: 4.9,
    reviews: 293,
    category: "non-woven-bag",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-130",
    name: "Canvas Bag",
    description:
      "High-quality Canvas Bag with premium materials and vibrant printing. Perfect for apparel needs.",
    price: 40,
    originalPrice: 104,
    discount: 24,
    rating: 4.2,
    reviews: 188,
    category: "canvas-bag",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-131",
    name: "Sublimation Tshirt",
    description:
      "High-quality Sublimation Tshirt with premium materials and vibrant printing. Perfect for apparel needs.",
    price: 87,
    originalPrice: 94,
    discount: 14,
    rating: 3.5,
    reviews: 150,
    category: "sublimation-tshirt",
    images: ["/images/products/apparel.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-132",
    name: "Cotton T Shirt",
    description:
      "High-quality Cotton T Shirt with premium materials and vibrant printing. Perfect for apparel needs.",
    price: 81,
    originalPrice: 163,
    discount: 8,
    rating: 3.5,
    reviews: 21,
    category: "cotton-t-shirt",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-133",
    name: "Islamic Khat",
    description:
      "High-quality Islamic Khat with premium materials and vibrant printing. Perfect for frame needs.",
    price: 31,
    originalPrice: 132,
    discount: 11,
    rating: 4,
    reviews: 167,
    category: "islamic-khat",
    images: ["/images/products/frame.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-134",
    name: "Portrait",
    description:
      "High-quality Portrait with premium materials and vibrant printing. Perfect for frame needs.",
    price: 85,
    originalPrice: 175,
    discount: 24,
    rating: 3.3,
    reviews: 299,
    category: "portrait",
    images: ["/images/products/frame.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-135",
    name: "Clock",
    description:
      "High-quality Clock with premium materials and vibrant printing. Perfect for frame needs.",
    price: 30,
    originalPrice: 174,
    discount: 16,
    rating: 3.8,
    reviews: 171,
    category: "clock",
    images: ["/images/products/frame.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-136",
    name: "Wedding Bunting",
    description:
      "High-quality Wedding Bunting with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 83,
    originalPrice: 93,
    discount: 17,
    rating: 4.8,
    reviews: 252,
    category: "wedding-bunting",
    images: ["/images/products/wedding_product.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-137",
    name: "Wedding Banner",
    description:
      "High-quality Wedding Banner with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 84,
    originalPrice: 128,
    discount: 10,
    rating: 3.7,
    reviews: 155,
    category: "wedding-banner",
    images: ["/images/products/wedding_product.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-138",
    name: "Arrow Bunting",
    description:
      "High-quality Arrow Bunting with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 45,
    originalPrice: 122,
    discount: 16,
    rating: 3.5,
    reviews: 234,
    category: "arrow-bunting",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-139",
    name: "Button Badge",
    description:
      "High-quality Button Badge with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 77,
    originalPrice: 131,
    discount: 6,
    rating: 5,
    reviews: 41,
    category: "button-badge",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-140",
    name: "Cek Hantaran",
    description:
      "High-quality Cek Hantaran with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 28,
    originalPrice: 146,
    discount: 9,
    rating: 3.2,
    reviews: 260,
    category: "cek-hantaran",
    images: ["/images/products/wedding_product.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-141",
    name: "Door Gift",
    description:
      "High-quality Door Gift with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 13,
    originalPrice: 148,
    discount: 9,
    rating: 4.9,
    reviews: 147,
    category: "door-gift",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-142",
    name: "Wedding Card",
    description:
      "High-quality Wedding Card with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 66,
    originalPrice: 174,
    discount: 15,
    rating: 3.9,
    reviews: 159,
    category: "wedding-card",
    images: ["/images/products/wedding_product.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-143",
    name: "Welcome Board",
    description:
      "High-quality Welcome Board with premium materials and vibrant printing. Perfect for wedding product needs.",
    price: 41,
    originalPrice: 162,
    discount: 14,
    rating: 4,
    reviews: 219,
    category: "welcome-board",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-144",
    name: "Menu Book",
    description:
      "High-quality Menu Book with premium materials and vibrant printing. Perfect for food packaging needs.",
    price: 59,
    originalPrice: 174,
    discount: 14,
    rating: 3.4,
    reviews: 241,
    category: "menu-book",
    images: ["/images/products/food_packaging.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-145",
    name: "Table Tent",
    description:
      "High-quality Table Tent with premium materials and vibrant printing. Perfect for food packaging needs.",
    price: 15,
    originalPrice: 147,
    discount: 8,
    rating: 3.3,
    reviews: 81,
    category: "table-tent",
    images: ["/images/products/digital_printing.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-146",
    name: "Table Display Stand",
    description:
      "High-quality Table Display Stand with premium materials and vibrant printing. Perfect for food packaging needs.",
    price: 85,
    originalPrice: 157,
    discount: 22,
    rating: 3.2,
    reviews: 177,
    category: "table-display-stand",
    images: ["/images/products/display_item.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-147",
    name: "Stand Pouch",
    description:
      "High-quality Stand Pouch with premium materials and vibrant printing. Perfect for food packaging needs.",
    price: 20,
    originalPrice: 180,
    discount: 13,
    rating: 3.8,
    reviews: 171,
    category: "stand-pouch",
    images: ["/images/products/display_item.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  },
  {
    _id: "prod-148",
    name: "Food Sticker",
    description:
      "High-quality Food Sticker with premium materials and vibrant printing. Perfect for food packaging needs.",
    price: 39,
    originalPrice: 132,
    discount: 5,
    rating: 4,
    reviews: 210,
    category: "food-sticker",
    images: ["/images/products/food_packaging.png"],
    colors: ["Red", "Blue", "Green", "Black", "White"],
    sizes: ["Small", "Medium", "Large", "Standard", "Custom"],
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          {
            label: "A4 (210 x 297 mm)",
            priceAdd: 0,
          },
          {
            label: "A5 (148 x 210 mm)",
            priceAdd: -5,
          },
          {
            label: "A3 (297 x 420 mm)",
            priceAdd: 15,
          },
          {
            label: "Custom Size",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Material",
        options: [
          {
            label: "Art Paper 157g",
            priceAdd: 0,
          },
          {
            label: "Art Card 260g",
            priceAdd: 5,
          },
          {
            label: "Glossy Photo Paper",
            priceAdd: 8,
          },
          {
            label: "Matte Premium Paper",
            priceAdd: 10,
          },
        ],
      },
      {
        name: "Printing Sides",
        options: [
          {
            label: "Single Sided",
            priceAdd: 0,
          },
          {
            label: "Double Sided",
            priceAdd: 15,
          },
        ],
      },
      {
        name: "Finishing Options",
        options: [
          {
            label: "None",
            priceAdd: 0,
          },
          {
            label: "Matte Lamination",
            priceAdd: 8,
          },
          {
            label: "Gloss Lamination",
            priceAdd: 8,
          },
          {
            label: "Spot UV",
            priceAdd: 20,
          },
        ],
      },
      {
        name: "Turnaround Time",
        options: [
          {
            label: "Standard (3-4 Working Days)",
            priceAdd: 0,
          },
          {
            label: "Express (1-2 Working Days)",
            priceAdd: 30,
          },
        ],
      },
    ],
  }, {
    _id: "prod-eeecbece-0c2a-4e06-b888-9df700ff4966",
    name: "A-DESIGN 2025-2026",
    description: "Islamic Khat Canvas - A-DESIGN 2025-2026",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-0d69dd9e-82ad-4f48-b744-8837aaf91cc7",
    name: "D-4 QUL (1 PANEL)",
    description: "Islamic Khat Canvas - D-4 QUL (1 PANEL)",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-574384df-6a08-48c4-a299-b5d4c0651d6a",
    name: "D-4 QUL (SET)",
    description: "Islamic Khat Canvas - D-4 QUL (SET)",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-4e88824b-00a4-4bb8-976e-2378285b46d7",
    name: "D-1000 DINAR",
    description: "Islamic Khat Canvas - D-1000 DINAR",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-74d80c27-d2e8-42cf-8acb-bf9d1356058b",
    name: "D-AD DHUHA",
    description: "Islamic Khat Canvas - D-AD DHUHA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-ce353cd9-7112-4faf-91bc-3643b7f9b1bc",
    name: "D-AL FATIHAH",
    description: "Islamic Khat Canvas - D-AL FATIHAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-af46ba3d-893f-42c2-a44c-cc9e811d3a0a",
    name: "D-AL MULK",
    description: "Islamic Khat Canvas - D-AL MULK",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-0d309afb-5ff7-49cf-a63f-2007feb00c0f",
    name: "D-ALLAH MUHAMMAD",
    description: "Islamic Khat Canvas - D-ALLAH MUHAMMAD",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-63bdb778-30c0-465d-b4fe-c0614d90c49c",
    name: "D-ASMA UL HUSNA",
    description: "Islamic Khat Canvas - D-ASMA UL HUSNA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-d778cfe7-f426-4b36-af14-eb7a219ebcd8",
    name: "D-ASMA UL HUSNA JAM",
    description: "Islamic Khat Canvas - D-ASMA UL HUSNA JAM",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-2c6abe7f-1aa0-42b6-b9aa-63e84a192693",
    name: "D-ASSALAMMU ALAIKUM",
    description: "Islamic Khat Canvas - D-ASSALAMMU ALAIKUM",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-c18d3ebe-149b-424f-938f-41f9c9af8aa8",
    name: "D-AT TAUBAH",
    description: "Islamic Khat Canvas - D-AT TAUBAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-4a49acaf-8d40-4601-9e94-dbe4b810eb51",
    name: "D-AYAT KURSI",
    description: "Islamic Khat Canvas - D-AYAT KURSI",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-96e7cc3c-ce1b-4f56-9067-9c727f24e4be",
    name: "D-AYAT KURSI KAABAH",
    description: "Islamic Khat Canvas - D-AYAT KURSI KAABAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-38e471b7-591d-4dc0-ab91-a90c43c5ea70",
    name: "D-BISMILLAH",
    description: "Islamic Khat Canvas - D-BISMILLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-50f420ca-b5d7-4240-9c90-339060b9ed89",
    name: "D-DEKO DAPUR",
    description: "Islamic Khat Canvas - D-DEKO DAPUR",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-47e82376-d5fa-455a-b212-1a2a33f787a2",
    name: "D-DOA MAKAN",
    description: "Islamic Khat Canvas - D-DOA MAKAN",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-7f8bb90d-2919-4a17-b49d-91c898cf7374",
    name: "D-HASBUNALLAH",
    description: "Islamic Khat Canvas - D-HASBUNALLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-e7ed7736-df09-4c18-8a32-2dfe3e9d90d8",
    name: "D-JAM 1 2 3 PANEL",
    description: "Islamic Khat Canvas - D-JAM 1 2 3 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-68830c98-4f43-40c2-8963-3299a392611c",
    name: "D-KAABAH",
    description: "Islamic Khat Canvas - D-KAABAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-37c01d83-a041-437e-a040-4c031311efee",
    name: "D-KHAT 3 PANEL",
    description: "Islamic Khat Canvas - D-KHAT 3 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-0869dc0d-4382-4df1-9041-638862e2b9c3",
    name: "D-KISWAH KAABAH",
    description: "Islamic Khat Canvas - D-KISWAH KAABAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-037e1bc3-d0f8-4347-b75a-ddd0b9882710",
    name: "D-LA ILAHAILLALLAH",
    description: "Islamic Khat Canvas - D-LA ILAHAILLALLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-bcc61f0c-67bb-47da-9e2d-6507d01f3557",
    name: "D-MASYAALLAH",
    description: "Islamic Khat Canvas - D-MASYAALLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-233d58f3-ea01-426d-b729-f4ce8d1d8a7d",
    name: "D-NIAT IKTKAF MASJID",
    description: "Islamic Khat Canvas - D-NIAT IKTKAF MASJID",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-7a16aa5f-3818-4850-82ef-fea6466c20f9",
    name: "D-PERJANJIAN NABI SULAIMAN",
    description: "Islamic Khat Canvas - D-PERJANJIAN NABI SULAIMAN",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-7add20a3-7ae2-4759-b5d0-1e69b5456efd",
    name: "D-PETA DUNIA",
    description: "Islamic Khat Canvas - D-PETA DUNIA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-89b99cb4-66f5-4873-aa7e-753253920bd0",
    name: "D-PETA DUNIA ADA NAMA NEGARA",
    description: "Islamic Khat Canvas - D-PETA DUNIA ADA NAMA NEGARA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-5e08d1e1-9dca-4558-88c4-4f7a498ffa49",
    name: "D-PHOTO VIEW 1 PANEL",
    description: "Islamic Khat Canvas - D-PHOTO VIEW 1 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-0798cc7a-4153-457e-91c3-01041e5054fd",
    name: "D-SSDI",
    description: "Islamic Khat Canvas - D-SSDI",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-5e321b15-5c05-4eb7-aa70-cb532bcc26cc",
    name: "D-SURAH AL KHAF",
    description: "Islamic Khat Canvas - D-SURAH AL KHAF",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-c649fe66-57ec-47b7-b313-1ebba154fbb2",
    name: "D-YASSIN",
    description: "Islamic Khat Canvas - D-YASSIN",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-4b276b53-d2aa-4def-bb19-8194ce7cf201",
    name: "D-ZIKIR 3 PANEL",
    description: "Islamic Khat Canvas - D-ZIKIR 3 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  },  {
    _id: "prod-dae3b779-d7dd-460a-bceb-52f12047e935",
    name: "D-ZIKIR 4 PANEL",
    description: "Islamic Khat Canvas - D-ZIKIR 4 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/logo-black.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [],
    reviews: []
  }
];
