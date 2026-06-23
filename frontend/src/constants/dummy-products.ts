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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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
    images: ["/images/products/logo-black.png"],
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

,  {
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
