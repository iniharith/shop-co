import { IProduct } from "@/types/IProduct";

export const dummyProducts: IProduct[] = [
  // DIGITAL OFFSET -> BUSINESS CARD
  {
    _id: "prod-bc-001",
    name: "Premium Business Cards",
    description: "Make a lasting impression with our premium quality business cards. Printed on thick, luxurious card stock with vibrant colors and crisp details. Perfect for networking and corporate identity.",
    price: 15.0,
    originalPrice: 25.0,
    discount: 40,
    rating: 4.9,
    category: "digital-offset",
    images: [
      "https://images.pexels.com/photos/8885627/pexels-photo-8885627.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/6373305/pexels-photo-6373305.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          { label: "Standard (90 x 54 mm)", priceAdd: 0 },
          { label: "Square (54 x 54 mm)", priceAdd: 5.0 },
          { label: "Custom Size", priceAdd: 10.0 }
        ]
      },
      {
        name: "Paper Material",
        options: [
          { label: "Art Card 260g (Standard)", priceAdd: 0 },
          { label: "Art Card 310g (Thick)", priceAdd: 8.0 },
          { label: "Textured Paper 250g", priceAdd: 15.0 }
        ]
      },
      {
        name: "Printing Sides",
        options: [
          { label: "Single Sided", priceAdd: 0 },
          { label: "Double Sided", priceAdd: 10.0 }
        ]
      },
      {
        name: "Lamination / Finishing",
        options: [
          { label: "None", priceAdd: 0 },
          { label: "Matte Lamination (Both Sides)", priceAdd: 8.0 },
          { label: "Gloss Lamination (Both Sides)", priceAdd: 8.0 },
          { label: "Soft Touch + Spot UV", priceAdd: 25.0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (3-4 Working Days)", priceAdd: 0 },
          { label: "Express (1-2 Working Days)", priceAdd: 20.0 }
        ]
      }
    ]
  },
  // DIGITAL OFFSET -> FLYERS
  {
    _id: "prod-fl-001",
    name: "Promotional Flyers (A4/A5)",
    description: "Spread the word about your events, products, or services with high-quality, eye-catching flyers. Fast printing with excellent color reproduction.",
    price: 35.0,
    originalPrice: 45.0,
    discount: 22,
    rating: 4.7,
    category: "digital-offset",
    images: [
      "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3856033/pexels-photo-3856033.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Format Size",
        options: [
          { label: "A5 (148 x 210 mm)", priceAdd: 0 },
          { label: "A4 (210 x 297 mm)", priceAdd: 20.0 },
          { label: "DL (99 x 210 mm)", priceAdd: -5.0 }
        ]
      },
      {
        name: "Paper Material",
        options: [
          { label: "Art Paper 128g", priceAdd: 0 },
          { label: "Art Paper 157g", priceAdd: 10.0 },
          { label: "Simili Paper 80g", priceAdd: -5.0 }
        ]
      },
      {
        name: "Printing Sides",
        options: [
          { label: "Single Sided", priceAdd: 0 },
          { label: "Double Sided", priceAdd: 15.0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (3-4 Working Days)", priceAdd: 0 },
          { label: "Next Day Delivery", priceAdd: 30.0 }
        ]
      }
    ]
  },
  // DIGITAL PRINTING -> BUNTING
  {
    _id: "prod-bt-001",
    name: "Outdoor Display Bunting",
    description: "Durable and weather-resistant outdoor bunting. Perfect for storefronts, events, and promotions. Printed on high-quality Tarpaulin for maximum longevity.",
    price: 25.0,
    originalPrice: 30.0,
    discount: 16,
    rating: 4.8,
    category: "digital-printing",
    images: [
      "https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1202723/pexels-photo-1202723.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Size (W x H)",
        options: [
          { label: "2ft x 5ft", priceAdd: 0 },
          { label: "2ft x 6ft", priceAdd: 5.0 },
          { label: "3ft x 6ft", priceAdd: 15.0 }
        ]
      },
      {
        name: "Material",
        options: [
          { label: "Tarpaulin 300gsm (Standard)", priceAdd: 0 },
          { label: "Tarpaulin 380gsm (Thick)", priceAdd: 8.0 },
          { label: "Synthetic Paper (Indoor use)", priceAdd: 12.0 }
        ]
      },
      {
        name: "Finishing",
        options: [
          { label: "PVC Pipe & String", priceAdd: 0 },
          { label: "Wood & String", priceAdd: 2.0 },
          { label: "Eyelets Only (4 corners)", priceAdd: 0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (2-3 Working Days)", priceAdd: 0 },
          { label: "Express (24 Hours)", priceAdd: 15.0 }
        ]
      }
    ]
  },
  // CORPORATE GIFT -> MUG
  {
    _id: "prod-mg-001",
    name: "Custom Printed White Mug",
    description: "Personalized ceramic mugs perfect for corporate gifts, events, or personal souvenirs. High-quality sublimation printing ensures the colors never fade.",
    price: 8.0,
    originalPrice: 12.0,
    discount: 33,
    rating: 4.6,
    category: "corporate-gift",
    images: [
      "https://images.pexels.com/photos/1207918/pexels-photo-1207918.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Mug Type",
        options: [
          { label: "Standard White Mug (11oz)", priceAdd: 0 },
          { label: "Color Inside Mug", priceAdd: 3.0 },
          { label: "Magic Color Changing Mug", priceAdd: 8.0 }
        ]
      },
      {
        name: "Packaging",
        options: [
          { label: "Standard White Box", priceAdd: 0 },
          { label: "Premium Gift Box", priceAdd: 2.5 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (4-5 Working Days)", priceAdd: 0 },
          { label: "Express (2 Working Days)", priceAdd: 15.0 }
        ]
      }
    ]
  },
  // APPAREL -> TSHIRT
  {
    _id: "prod-ts-001",
    name: "Custom Printed Cotton T-Shirt",
    description: "Comfortable 100% cotton t-shirts printed with your custom design. Available in various colors and sizes. Ideal for company events, family days, and merchandise.",
    price: 18.0,
    originalPrice: 25.0,
    discount: 28,
    rating: 4.9,
    category: "apparel",
    images: [
      "https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Material",
        options: [
          { label: "100% Cotton 160gsm", priceAdd: 0 },
          { label: "Premium Cotton 190gsm", priceAdd: 5.0 },
          { label: "Microfiber (Dry Fit)", priceAdd: 2.0 }
        ]
      },
      {
        name: "Printing Method",
        options: [
          { label: "Silkscreen (1 Color)", priceAdd: 0 },
          { label: "DTF (Full Color) - A4 Size", priceAdd: 10.0 },
          { label: "DTF (Full Color) - A3 Size", priceAdd: 15.0 },
          { label: "Embroidery (Logo size)", priceAdd: 12.0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (7-10 Working Days)", priceAdd: 0 },
          { label: "Express (3-5 Working Days)", priceAdd: 30.0 }
        ]
      }
    ]
  },
  // DISPLAY ITEM -> ROLL UP STAND
  {
    _id: "prod-ru-001",
    name: "Premium Roll Up Bunting Stand",
    description: "High-quality, portable roll-up stand perfect for exhibitions, trade shows, and retail displays. Comes with a padded carrying bag and vibrant printed graphics.",
    price: 85.0,
    originalPrice: 110.0,
    discount: 22,
    rating: 4.8,
    category: "display-item",
    images: [
      "https://images.pexels.com/photos/2097085/pexels-photo-2097085.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Size",
        options: [
          { label: "2.5ft x 6.5ft (Standard)", priceAdd: 0 },
          { label: "3ft x 6.5ft (Wide)", priceAdd: 20.0 }
        ]
      },
      {
        name: "Material",
        options: [
          { label: "Synthetic Paper + Matte Lam", priceAdd: 0 },
          { label: "Synthetic Paper + Gloss Lam", priceAdd: 0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (3 Working Days)", priceAdd: 0 },
          { label: "Express (24 Hours)", priceAdd: 25.0 }
        ]
      }
    ]
  },
  // WEDDING PRODUCT -> WEDDING CARD
  {
    _id: "prod-wc-001",
    name: "Elegant Wedding Invitation Cards",
    description: "Beautifully designed and printed wedding invitation cards. Set the perfect tone for your special day with high-quality printing and exquisite finishes.",
    price: 45.0,
    originalPrice: 60.0,
    discount: 25,
    rating: 4.9,
    category: "wedding-product",
    images: [
      "https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Format & Size",
        options: [
          { label: "A5 Single Sheet (148x210mm)", priceAdd: 0 },
          { label: "A4 Folded to A5", priceAdd: 20.0 },
          { label: "Square (150x150mm)", priceAdd: 10.0 }
        ]
      },
      {
        name: "Material & Finish",
        options: [
          { label: "Art Card 260g", priceAdd: 0 },
          { label: "Ivory Card 250g (Textured)", priceAdd: 15.0 },
          { label: "Art Card 260g + Matte Lam + Gold Stamping", priceAdd: 50.0 }
        ]
      },
      {
        name: "Add-ons",
        options: [
          { label: "Cards Only", priceAdd: 0 },
          { label: "Include White Envelopes", priceAdd: 10.0 },
          { label: "Include Custom Printed Envelopes", priceAdd: 35.0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (7 Working Days)", priceAdd: 0 },
          { label: "Express (3 Working Days)", priceAdd: 40.0 }
        ]
      }
    ]
  },
  // FOOD PACKAGING -> STAND POUCH
  {
    _id: "prod-fp-001",
    name: "Custom Stand Up Pouch",
    description: "Professional stand-up pouches for food, coffee, or retail products. High barrier properties to keep your products fresh with a premium printed look.",
    price: 120.0,
    originalPrice: 150.0,
    discount: 20,
    rating: 4.5,
    category: "food-packaging",
    images: [
      "https://images.pexels.com/photos/1630588/pexels-photo-1630588.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    printingOptions: [
      {
        name: "Size & Capacity",
        options: [
          { label: "Small (100g - 110x170mm)", priceAdd: 0 },
          { label: "Medium (250g - 130x210mm)", priceAdd: 30.0 },
          { label: "Large (500g - 160x260mm)", priceAdd: 60.0 }
        ]
      },
      {
        name: "Material",
        options: [
          { label: "Clear Front / Foil Back", priceAdd: 0 },
          { label: "Full Aluminum Foil (Matte)", priceAdd: 20.0 },
          { label: "Kraft Paper with Window", priceAdd: 35.0 }
        ]
      },
      {
        name: "Features",
        options: [
          { label: "Ziplock Only", priceAdd: 0 },
          { label: "Ziplock + Tear Notch", priceAdd: 5.0 },
          { label: "Ziplock + Valve (For Coffee)", priceAdd: 25.0 }
        ]
      },
      {
        name: "Turnaround Time",
        options: [
          { label: "Standard (14 Working Days)", priceAdd: 0 },
          { label: "Express (7 Working Days)", priceAdd: 80.0 }
        ]
      }
    ]
  }
];
