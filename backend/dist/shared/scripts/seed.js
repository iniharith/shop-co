"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceSeedProducts = void 0;
const product_repository_1 = require("../../infrastructure/db/repositories/product.repository");
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
// Same dummy products from frontend, formatted for backend
const data = [
    {
        name: "Premium Business Cards",
        description: "Make a lasting impression with our premium quality business cards.",
        price: 15.0,
        originalPrice: 25.0,
        discount: 40,
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
    }
];
const forceSeedProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Dropping existing products...");
        yield product_model_1.default.deleteMany({});
        console.log("Seeding new printing products...");
        const productRepository = new product_repository_1.ProductRepository();
        yield productRepository.createMany(data);
        console.log("Seeding complete.");
        return true;
    }
    catch (e) {
        console.error("Seeding failed", e);
        return false;
    }
});
exports.forceSeedProducts = forceSeedProducts;
