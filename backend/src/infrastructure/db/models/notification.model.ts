/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from "mongoose";
import { NotificationDocument } from "../../../domain/interfaces/notification.interface";

const NotificationSchema = new Schema<NotificationDocument>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["ORDER", "PROMOTION", "SYSTEM", "DELIVERY","VERIFICATION"],
        required: true,
      },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
      taskId: {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
      link: {
        type: String,
      },
      read: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true, // adds createdAt and updatedAt
    }
  );
  NotificationSchema.index({ userId: 1, createdAt: -1 });
  NotificationSchema.index({ userId: 1, read: 1 });
  
  export const NotificationModel = mongoose.model<NotificationDocument>(
    "Notification",
    NotificationSchema
  );
