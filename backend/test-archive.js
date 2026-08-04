/**
 * Coded by Harith
 * Kampungcetak ®
 */
const axios = require('axios');
const mongoose = require('mongoose');

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');
  await mongoose.connect(mongoUri);
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
  
  await mongoose.disconnect();
}
run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
