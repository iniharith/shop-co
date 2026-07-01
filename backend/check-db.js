/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    const products = await db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products.`);
    if (products.length > 0) {
      console.log('First 3 products:');
      console.log(products.slice(0, 3).map(p => ({ name: p.name, images: p.images })));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
