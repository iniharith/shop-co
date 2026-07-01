/**
 * Coded by Harith
 * Kampungcetak ®
 */
const mongoose = require('mongoose');
const url = 'mongodb://Admin_Harith:nutella210620@ac-ygpaslc-shard-00-00.dcoixot.mongodb.net:27017,ac-ygpaslc-shard-00-01.dcoixot.mongodb.net:27017,ac-ygpaslc-shard-00-02.dcoixot.mongodb.net:27017/shop-co?ssl=true&replicaSet=atlas-ygpaslc-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Kampungcetak';

mongoose.connect(url).then(async () => {
    const res = await mongoose.connection.db.collection('products').updateMany({name: /Business Card/i}, {$set: {price: 15}});
    console.log("Update Result:", res);
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
