const mongoose = require('mongoose');

async function main() {
  const uri = "mongodb+srv://Admin_Harith:nutella210620@cluster0.dcoixot.mongodb.net/shop-co?retryWrites=true&w=majority&appName=Kampungcetak";
  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;
    const files = await db.collection('files').find({ originalName: /ALIAHNORHALIM/i }).toArray();
    console.log(JSON.stringify(files, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
