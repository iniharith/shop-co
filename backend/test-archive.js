/**
 * Coded by Harith
 * Kampungcetak ®
 */
const axios = require('axios');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://Admin_Harith:nutella210620@ac-ygpaslc-shard-00-00.dcoixot.mongodb.net:27017,ac-ygpaslc-shard-00-01.dcoixot.mongodb.net:27017,ac-ygpaslc-shard-00-02.dcoixot.mongodb.net:27017/shop-co?ssl=true&replicaSet=atlas-ygpaslc-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Kampungcetak');
  console.log("connected");
  
  const order = await mongoose.connection.collection('orders').findOne({});
  console.log("Order found:", order._id.toString());
  
  try {
     const res = await axios.patch(`https://api.kampungcetak.com/api/orders/${order._id.toString()}/archive`, { isArchived: true });
     console.log("Success:", res.status);
  } catch (err) {
     console.log("Error api.kampungcetak.com:", err.response?.status, err.response?.data || err.message);
  }
  
  try {
     const res = await axios.patch(`https://admin.kampungcetak.com/api/orders/${order._id.toString()}/archive`, { isArchived: true });
     console.log("Success:", res.status);
  } catch (err) {
     console.log("Error admin.kampungcetak.com:", err.response?.status, err.response?.data || err.message);
  }
  
  process.exit(0);
}
run();
