/**
 * Coded by Harith
 * Kampungcetak ®
 */
﻿const fs = require('fs');
const names = [
  'A-DESIGN 2025-2026', 'D-4 QUL (1 PANEL)', 'D-4 QUL (SET)', 'D-1000 DINAR',
  'D-AD DHUHA', 'D-AL FATIHAH', 'D-AL MULK', 'D-ALLAH MUHAMMAD',
  'D-ASMA UL HUSNA', 'D-ASMA UL HUSNA JAM', 'D-ASSALAMMU ALAIKUM',
  'D-AT TAUBAH', 'D-AYAT KURSI', 'D-AYAT KURSI KAABAH', 'D-BISMILLAH',
  'D-DEKO DAPUR', 'D-DOA MAKAN', 'D-HASBUNALLAH', 'D-JAM 1 2 3 PANEL',
  'D-KAABAH', 'D-KHAT 3 PANEL', 'D-KISWAH KAABAH', 'D-LA ILAHAILLALLAH',
  'D-MASYAALLAH', 'D-NIAT IKTKAF MASJID', 'D-PERJANJIAN NABI SULAIMAN',
  'D-PETA DUNIA', 'D-PETA DUNIA ADA NAMA NEGARA', 'D-PHOTO VIEW 1 PANEL',
  'D-SSDI', 'D-SURAH AL KHAF', 'D-YASSIN', 'D-ZIKIR 3 PANEL', 'D-ZIKIR 4 PANEL'
];

let content = fs.readFileSync('backend/src/shared/scripts/seed.ts', 'utf8');

const additionalData = names.map(name => {
    return \  {
    name: "\",
    description: "Islamic Khat Canvas - \",
    price: 150.0,
    originalPrice: 150.0,
    discount: 0,
    rating: 5.0,
    category: "Islamic Khat",
    images: ["/images/products/frame.png"],
    sizes: [{ size: "Standard", stock: 1000 }],
    printingOptions: []
  }\;
}).join(',\\n');

content = content.replace('];\\n\\nexport const forceSeedProducts', ',\\n' + additionalData + '\\n];\\n\\nexport const forceSeedProducts');
// Try CRLF if LF doesn't work
content = content.replace('];\\r\\n\\r\\nexport const forceSeedProducts', ',\\r\\n' + additionalData + '\\r\\n];\\r\\n\\r\\nexport const forceSeedProducts');

fs.writeFileSync('backend/src/shared/scripts/seed.ts', content);
