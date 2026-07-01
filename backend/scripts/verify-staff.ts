/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/shop-co";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const db = mongoose.connection.db;
  if (!db) throw new Error("DB not found");

  const result = await db.collection('users').updateMany(
    { role: { $ne: 'client' } },
    { $set: { verified: true } }
  );

  console.log(`Updated ${result.modifiedCount} staff users to verified: true.`);

  await mongoose.disconnect();
}

run().catch(console.error);
