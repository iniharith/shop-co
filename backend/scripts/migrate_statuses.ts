import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../src/infrastructure/db/models/order.model";
import { Task } from "../src/domain/entities/Task";

import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function migrateStatuses() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to DB");

    // Migrate Orders
    const orderRes1 = await Order.updateMany(
      { orderStatus: "ARTWORK_REVIEW" },
      { $set: { orderStatus: "ARTWORK_REVIEWED" } }
    );
    console.log(`Orders migrated from ARTWORK_REVIEW to ARTWORK_REVIEWED: ${orderRes1.modifiedCount}`);

    const orderRes2 = await Order.updateMany(
      { orderStatus: "DONE DESIGN" },
      { $set: { orderStatus: "DONE_DESIGN" } }
    );
    console.log(`Orders migrated from DONE DESIGN to DONE_DESIGN: ${orderRes2.modifiedCount}`);

    // Migrate Tasks
    const taskRes1 = await Task.updateMany(
      { status: "ARTWORK_REVIEW" },
      { $set: { status: "ARTWORK_REVIEWED" } }
    );
    console.log(`Tasks migrated from ARTWORK_REVIEW to ARTWORK_REVIEWED: ${taskRes1.modifiedCount}`);

    const taskRes2 = await Task.updateMany(
      { status: "DONE DESIGN" },
      { $set: { status: "DONE_DESIGN" } }
    );
    console.log(`Tasks migrated from DONE DESIGN to DONE_DESIGN: ${taskRes2.modifiedCount}`);

    const taskRes3 = await Task.updateMany(
      { status: "TODO" },
      { $set: { status: "PLACED" } }
    );
    console.log(`Tasks migrated from TODO to PLACED: ${taskRes3.modifiedCount}`);

    console.log("Migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateStatuses();
