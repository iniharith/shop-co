import { ProductRepository } from "../../infrastructure/db/repositories/product.repository";
import ProductModel from "../../infrastructure/db/models/product.model";

// Same dummy products from frontend, formatted for backend
const data = [
  {
    name: "Premium Business Cards",
    description: "Make a lasting impression with our premium quality business cards.",
    price: 15.0,
    originalPrice: 25.0,
    discount: 0,
    rating: 4.9,
    category: "digital-offset",
    images: ["https://images.pexels.com/photos/8885627/pexels-photo-8885627.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/6373305/pexels-photo-6373305.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [
      { name: "Format & Size", options: [{ label: "Standard (90 x 54 mm)", priceAdd: 0 }, { label: "Square", priceAdd: 5.0 }] },
      { name: "Paper Material", options: [{ label: "Art Card 260g", priceAdd: 0 }, { label: "Textured Paper", priceAdd: 15.0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard (3 Days)", priceAdd: 0 }, { label: "Express", priceAdd: 20.0 }] }
    ]
  },
  {
    name: "Promotional Flyers (A4/A5)",
    description: "Spread the word about your events with high-quality flyers.",
    price: 35.0,
    originalPrice: 45.0,
    discount: 22,
    rating: 4.7,
    category: "digital-offset",
    images: ["https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [
      { name: "Format Size", options: [{ label: "A5", priceAdd: 0 }, { label: "A4", priceAdd: 20.0 }] },
      { name: "Printing Sides", options: [{ label: "Single Sided", priceAdd: 0 }, { label: "Double Sided", priceAdd: 15.0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard (3-4 Days)", priceAdd: 0 }] }
    ]
  },
  {
    name: "Outdoor Display Bunting",
    description: "Durable and weather-resistant outdoor bunting.",
    price: 25.0,
    originalPrice: 30.0,
    discount: 16,
    rating: 4.8,
    category: "digital-printing",
    images: ["https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [
      { name: "Size (W x H)", options: [{ label: "2ft x 5ft", priceAdd: 0 }, { label: "3ft x 6ft", priceAdd: 15.0 }] },
      { name: "Material", options: [{ label: "Tarpaulin 300gsm", priceAdd: 0 }, { label: "Tarpaulin 380gsm", priceAdd: 8.0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard", priceAdd: 0 }, { label: "Express", priceAdd: 15.0 }] }
    ]
  },
  {
    name: "Custom Printed White Mug",
    description: "Personalized ceramic mugs perfect for corporate gifts.",
    price: 8.0,
    originalPrice: 12.0,
    discount: 33,
    rating: 4.6,
    category: "corporate-gift",
    images: ["https://images.pexels.com/photos/1207918/pexels-photo-1207918.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [
      { name: "Mug Type", options: [{ label: "Standard White", priceAdd: 0 }, { label: "Magic Color", priceAdd: 8.0 }] },
      { name: "Packaging", options: [{ label: "White Box", priceAdd: 0 }, { label: "Premium Box", priceAdd: 2.5 }] },
      { name: "Turnaround Time", options: [{ label: "Standard", priceAdd: 0 }] }
    ]
  },
  {
    name: "Custom Printed Cotton T-Shirt",
    description: "Comfortable 100% cotton t-shirts printed with your custom design.",
    price: 18.0,
    originalPrice: 25.0,
    discount: 28,
    rating: 4.9,
    category: "apparel",
    images: ["https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "S", stock: 100 }, { size: "M", stock: 100 }, { size: "L", stock: 100 }],
    printingOptions: [
      { name: "Material", options: [{ label: "100% Cotton 160gsm", priceAdd: 0 }, { label: "Microfiber", priceAdd: 2.0 }] },
      { name: "Printing Method", options: [{ label: "Silkscreen (1 Color)", priceAdd: 0 }, { label: "DTF Full Color", priceAdd: 10.0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard", priceAdd: 0 }] }
    ]
  },
  {
    name: "Premium Roll Up Bunting Stand",
    description: "High-quality, portable roll-up stand perfect for exhibitions.",
    price: 85.0,
    originalPrice: 110.0,
    discount: 22,
    rating: 4.8,
    category: "display-item",
    images: ["https://images.pexels.com/photos/2097085/pexels-photo-2097085.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 50 }],
    printingOptions: [
      { name: "Size", options: [{ label: "2.5ft x 6.5ft", priceAdd: 0 }, { label: "3ft x 6.5ft", priceAdd: 20.0 }] },
      { name: "Material", options: [{ label: "Synthetic Paper", priceAdd: 0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard", priceAdd: 0 }] }
    ]
  },
  {
    name: "Elegant Wedding Invitation Cards",
    description: "Beautifully designed and printed wedding invitation cards.",
    price: 45.0,
    originalPrice: 60.0,
    discount: 25,
    rating: 4.9,
    category: "wedding-product",
    images: ["https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [
      { name: "Format & Size", options: [{ label: "A5 Single Sheet", priceAdd: 0 }, { label: "Square", priceAdd: 10.0 }] },
      { name: "Material & Finish", options: [{ label: "Art Card 260g", priceAdd: 0 }, { label: "Textured Ivory Card", priceAdd: 15.0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard", priceAdd: 0 }] }
    ]
  },
  {
    name: "Custom Stand Up Pouch",
    description: "Professional stand-up pouches for food, coffee, or retail products.",
    price: 120.0,
    originalPrice: 150.0,
    discount: 20,
    rating: 4.5,
    category: "food-packaging",
    images: ["https://images.pexels.com/photos/1630588/pexels-photo-1630588.jpeg?auto=compress&cs=tinysrgb&w=800"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: [
      { name: "Size & Capacity", options: [{ label: "Small (100g)", priceAdd: 0 }, { label: "Medium (250g)", priceAdd: 30.0 }] },
      { name: "Material", options: [{ label: "Clear Front / Foil Back", priceAdd: 0 }, { label: "Full Foil", priceAdd: 20.0 }] },
      { name: "Turnaround Time", options: [{ label: "Standard (14 Days)", priceAdd: 0 }] }
    ]
  },  {
    name: "A-DESIGN 2025-2026",
    description: "Islamic Khat Canvas - A-DESIGN 2025-2026",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-4 QUL (1 PANEL)",
    description: "Islamic Khat Canvas - D-4 QUL (1 PANEL)",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-4 QUL (SET)",
    description: "Islamic Khat Canvas - D-4 QUL (SET)",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-1000 DINAR",
    description: "Islamic Khat Canvas - D-1000 DINAR",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-AD DHUHA",
    description: "Islamic Khat Canvas - D-AD DHUHA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-AL FATIHAH",
    description: "Islamic Khat Canvas - D-AL FATIHAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-AL MULK",
    description: "Islamic Khat Canvas - D-AL MULK",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-ALLAH MUHAMMAD",
    description: "Islamic Khat Canvas - D-ALLAH MUHAMMAD",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-ASMA UL HUSNA",
    description: "Islamic Khat Canvas - D-ASMA UL HUSNA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-ASMA UL HUSNA JAM",
    description: "Islamic Khat Canvas - D-ASMA UL HUSNA JAM",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-ASSALAMMU ALAIKUM",
    description: "Islamic Khat Canvas - D-ASSALAMMU ALAIKUM",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-AT TAUBAH",
    description: "Islamic Khat Canvas - D-AT TAUBAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-AYAT KURSI",
    description: "Islamic Khat Canvas - D-AYAT KURSI",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-AYAT KURSI KAABAH",
    description: "Islamic Khat Canvas - D-AYAT KURSI KAABAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-BISMILLAH",
    description: "Islamic Khat Canvas - D-BISMILLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-DEKO DAPUR",
    description: "Islamic Khat Canvas - D-DEKO DAPUR",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-DOA MAKAN",
    description: "Islamic Khat Canvas - D-DOA MAKAN",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-HASBUNALLAH",
    description: "Islamic Khat Canvas - D-HASBUNALLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-JAM 1 2 3 PANEL",
    description: "Islamic Khat Canvas - D-JAM 1 2 3 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-KAABAH",
    description: "Islamic Khat Canvas - D-KAABAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-KHAT 3 PANEL",
    description: "Islamic Khat Canvas - D-KHAT 3 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-KISWAH KAABAH",
    description: "Islamic Khat Canvas - D-KISWAH KAABAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-LA ILAHAILLALLAH",
    description: "Islamic Khat Canvas - D-LA ILAHAILLALLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-MASYAALLAH",
    description: "Islamic Khat Canvas - D-MASYAALLAH",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-NIAT IKTKAF MASJID",
    description: "Islamic Khat Canvas - D-NIAT IKTKAF MASJID",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-PERJANJIAN NABI SULAIMAN",
    description: "Islamic Khat Canvas - D-PERJANJIAN NABI SULAIMAN",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-PETA DUNIA",
    description: "Islamic Khat Canvas - D-PETA DUNIA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-PETA DUNIA ADA NAMA NEGARA",
    description: "Islamic Khat Canvas - D-PETA DUNIA ADA NAMA NEGARA",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-PHOTO VIEW 1 PANEL",
    description: "Islamic Khat Canvas - D-PHOTO VIEW 1 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-SSDI",
    description: "Islamic Khat Canvas - D-SSDI",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-SURAH AL KHAF",
    description: "Islamic Khat Canvas - D-SURAH AL KHAF",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-YASSIN",
    description: "Islamic Khat Canvas - D-YASSIN",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-ZIKIR 3 PANEL",
    description: "Islamic Khat Canvas - D-ZIKIR 3 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  },  {
    name: "D-ZIKIR 4 PANEL",
    description: "Islamic Khat Canvas - D-ZIKIR 4 PANEL",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["https://kampungcetak.com/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  }
];

export const forceSeedProducts = async () => {
    try {
        console.log("Dropping existing products...");
        await ProductModel.deleteMany({});
        console.log("Seeding new printing products...");
        const productRepository = new ProductRepository();
        await productRepository.createMany(data);
        console.log("Seeding complete.");
        return true;
    } catch (e) {
        console.error("Seeding failed", e);
        return false;
    }
};

