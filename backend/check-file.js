const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;
    const files = await db.collection('files').find({ originalName: /ALIAHNORHALIM/i }).toArray();
    console.log(JSON.stringify(files, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
