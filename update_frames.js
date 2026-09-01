/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const prefix = 'export const dummyProducts: any[] = [';
const startIndex = content.indexOf(prefix);
if (startIndex === -1) throw new Error("Could not find start");

const body = content.substring(startIndex + prefix.length - 1, content.lastIndexOf('];') + 1);

let products = JSON.parse(body);

// UPDATE PORTRAIT (prod-134)
const portrait = products.find(p => p._id === 'prod-134');
if (portrait) {
    portrait.price = 38;
    portrait.name = "Portrait";
    
    // Create the printing options
    portrait.printingOptions = [
        {
            name: "Size",
            options: [
                { label: "8X8", priceAdd: 0 },
                { label: "8X12", priceAdd: 0 },
                { label: "10X10", priceAdd: 0 },
                { label: "12X12", priceAdd: 0 },
                { label: "12X18", priceAdd: 52 - 38 },
                { label: "12X24", priceAdd: 72 - 38 },
                { label: "12X36", priceAdd: 76 - 38 },
                { label: "12X48", priceAdd: 104 - 38 },
                { label: "18X18", priceAdd: 80 - 38 },
                { label: "18X24", priceAdd: 80 - 38 },
                { label: "18X36", priceAdd: 88 - 38 },
                { label: "18X48", priceAdd: 132 - 38 },
                { label: "24X24", priceAdd: 84 - 38 },
                { label: "24X36", priceAdd: 124 - 38 },
                { label: "24X48", priceAdd: 132 - 38 },
                { label: "36X36", priceAdd: 168 - 38 },
                { label: "36X48", priceAdd: 180 - 38 },
                { label: "48X48", priceAdd: 196 - 38 }
            ]
        }
    ];
}

// UPDATE ISLAMIC KHAT
products = products.filter(p => p.category !== "Islamic Khat");

const khatData = [
  ["KISWAH", "130"],
  ["4QUL 24X48", "130"],
  ["4 QUL 24X48 + (24X18)2PCS", "239"],
  ["AYAT KURSI MASJID", "149"],
  ["KAABAH SYAHADAH 48X48", "216"],
  ["KAABAH SYAHADAH 36X36", "157"],
  ["FRAME JAM 24X24 + (12X24)2PCS", "197"],
  ["ASMAUL HUSNA 24X48", "129"],
  ["KAABAH 36X36 + (24X24)2PCS", "337"],
  ["KAABAH 36x36 + (18x18)2pcs", "249"],
  ["KAABAH 24X24 + (18X18)2PCS", "182"],
  ["KAABAH 24X24 + (12X12)2PCS", "154"],
  ["PETA DUNIA 36X36 + (24X24)2PCS", "365"],
  ["PETA DUNIA 24X24 + (12X12)2PCS", "182"],
  ["PETA DUNIA 48X48", "216"],
  ["PETA DUNIA 36X48", "185"],
  ["PETA UNIA 36X36", "159"],
  ["ASMAUL HUSNA 36X36", "159"],
  ["JAM ASMAULHUSNA 48X48 +(24X48)2PCS", "450"],
  ["JAM ASMAULHUSNA 36X36 +(18X36)2PCS", "320"],
  ["AYAT SERIBU DINAR 24X36 + (18X18)2PCS", "199"],
  ["DECO PINTU 12X36 +(12X12)2PCS", "115"],
  ["AYAT KURSI 24X48", "130"],
  ["JAM 3 PANEL 12X18", "135"],
  ["ZIKIR 3 PAEL 12X24", "128"],
  ["SURAH ALKAHFI 24X48", "248"],
  ["AL KAHFI 36X36", "148"],
  ["4 QUL 4 PANEL 18X24", "239"],
  ["AYAT KURSI KAABAH 36X48", "189"],
  ["ASMAULHUSNA 36X48", "189"],
  ["JAM 3 PANEL 18X24", "199"],
  ["AYAT KURSI 24X24 + (12X24)2PCS", "220"],
  ["JAM KABAH 3PANEL 12X18", "129"],
  ["SURRAH ASSIN 36X48", "189"],
  ["FRAME ALLAH MUHAMMMAD 20X30", "199"],
  ["SURAH ATTAUBAH 36X48", "189"],
  ["SURAH ATTAUBAH 24X24 + (12X24)2PCS", "189"],
  ["HSBUNALLAH 18X30 + ( 18X18)2PCS", "199"],
  ["KUFI SYAHADAH 20X30", "199"],
  ["4 QUL 3 PANEL 36X48 + (18X48)2PCS", "389"],
  ["ASSALAMUALIKUM 10X24", "49"],
  ["ASSALAMUALIKUM 10X24 + (10X10)2PCS", "99"],
  ["DECO WORD MAP CLOCK 36X48", "239"],
  ["24x36 + 12x24(2pcs)", "199"],
  ["24x48 (jam)", "149"],
  ["24x36 (jam) + 12x24(2pcs)", "250"],
  ["Ayat kursi masjid 18x24 + 12x24(2pcs)", "169"],
  ["18X36 + 18X18 (2PCS)", "199"],
  ["18x30 + 12x18(2pcs)", "169"],
  ["12x24 + 12x12(2pcs)", "99"],
  ["12x12 3pcs", "66"],
  ["Frame Zikir 8x8 inch (4 panel)", "80"],
  ["Frame Zikir 10x10 inch (4 panel)", "94"],
  ["Niat Iktikaf (12x36 inch)", "72"],
  ["Frame Peta dunia 3 panel (48x48 , 24x24)", "436"],
  ["Frame Ayat kursi 3 panel (48x48 , 24x24)", "436"],
  ["Frame Ayat 1000 dinar (24x36 , 18x24)", "244"],
  ["Frame Asma Ul Husna 36x48 (Ada Jam)", "244"]
];

let baseId = 200; // Let's use prod-200 onwards for Islamic Khat
khatData.forEach(([name, priceStr]) => {
    let price = parseInt(priceStr.replace(/[^0-9]/g, ''));
    if (isNaN(price)) price = 0;
    
    products.push({
      "_id": "prod-" + (baseId++),
      "name": name.trim(),
      "description": "High-quality Islamic Khat - " + name.trim(),
      "price": price,
      "originalPrice": price + 20,
      "discount": 0,
      "rating": 5,
      "reviews": Math.floor(Math.random() * 100) + 10,
      "category": "Islamic Khat",
      "images": ["/images/products/logo-black.png"],
      "colors": ["Standard"],
      "sizes": ["Standard"]
    });
});

const newContent = content.substring(0, startIndex) + 
                   "export const dummyProducts: any[] = " + 
                   JSON.stringify(products, null, 2) + 
                   ";\n";

fs.writeFileSync('frontend/src/constants/dummy-products.ts', newContent);
console.log("Successfully updated dummy-products.ts");
