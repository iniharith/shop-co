import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');

  const apply = process.argv.includes('--apply');
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || 'shop-co',
    serverSelectionTimeoutMS: 10_000,
  });

  const tasks = mongoose.connection.collection('tasks');
  const missingHistory = {
    $or: [
      { statusHistory: { $exists: false } },
      { statusHistory: { $size: 0 } },
    ],
  };
  const count = await tasks.countDocuments(missingHistory);

  if (!apply) {
    console.log(`Dry run: ${count} task(s) need an initial status-history entry.`);
    console.log('Run with --apply to update them.');
    return;
  }

  const result = await tasks.updateMany(missingHistory, [{
    $set: {
      statusHistory: [{
        fromStatus: null,
        toStatus: { $ifNull: ['$status', 'PLACED'] },
        fromIsDone: false,
        toIsDone: { $ifNull: ['$isDone', false] },
        changedAt: {
          $ifNull: ['$statusUpdatedAt', { $ifNull: ['$createdAt', '$$NOW'] }],
        },
        estimated: true,
      }],
    },
  }] as any);

  console.log(`Backfilled ${result.modifiedCount} of ${count} task(s).`);
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(() => undefined));
