/**
 * Coded by Harith
 * Kampungcetak ®
 */
﻿import mongoose from 'mongoose';

const uri = 'mongodb://Admin_Harith:nutella210620@ac-ygpaslc-shard-00-00.dcoixot.mongodb.net:27017,ac-ygpaslc-shard-00-01.dcoixot.mongodb.net:27017,ac-ygpaslc-shard-00-02.dcoixot.mongodb.net:27017/shop-co?ssl=true&replicaSet=atlas-ygpaslc-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Kampungcetak';

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    sizes: [{ stock: Number, size: String }],
    images: [{ type: String }],
});

const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

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

async function seed() {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    for (const name of names) {
        const existing = await ProductModel.findOne({ name });
        if (!existing) {
            await ProductModel.create({
                name,
                description: 'Islamic Khat Canvas - ' + name,
                price: 150,
                category: 'Islamic Khat',
                sizes: [{ stock: 10, size: 'A3' }, { stock: 10, size: 'A4' }],
                images: ['/images/products/frame.png']
            });
            console.log('Created ' + name);
        } else {
            console.log('Exists ' + name);
        }
    }
    await mongoose.disconnect();
}

seed().catch(console.error);
