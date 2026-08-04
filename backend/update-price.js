/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose = require('mongoose');
const url = process.env.MONGO_URI;

if (!url) throw new Error('MONGO_URI is required');

mongoose.connect(url).then(async () => {
    const res = await mongoose.connection.db.collection('products').updateMany({name: /Business Card/i}, {$set: {price: 15}});
    console.log("Update Result:", res);
    await mongoose.disconnect();
}).catch(e => {
    console.error(e);
    process.exitCode = 1;
});
