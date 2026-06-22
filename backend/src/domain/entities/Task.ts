import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskComment {
  userId: string;
  userName: string;
  text: string;
  role?: string;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  assignee?: string; // Admin User ID
  dueDate?: Date;
  orderId?: string; // Linked Order ID
  customerUsername?: string; // Linked Customer Username
  status: 'PLACED' | 'PENDING_ARTWORK' | 'ARTWORK_REVIEW' | 'ARTWORK_REJECTED' | 'IN_DESIGN' | 'IN_PRODUCTION' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED' | 'TODO' | 'IN_PROGRESS' | 'DONE DESIGN' | 'PEMBETULAN';
  files: { url: string; name: string }[];
  comments: ITaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assignee: { type: String, default: null }, // Mongoose ObjectId string
    dueDate: { type: Date, default: null },
    orderId: { type: String, default: null },
    customerUsername: { type: String, default: '' },
    status: { type: String, enum: ['PLACED', 'PENDING_ARTWORK', 'ARTWORK_REVIEW', 'ARTWORK_REJECTED', 'IN_DESIGN', 'IN_PRODUCTION', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'TODO', 'IN_PROGRESS', 'DONE DESIGN', 'PEMBETULAN'], default: 'TODO' },
    files: [{
      url: { type: String, required: true },
      name: { type: String, required: true }
    }],
    comments: [TaskCommentSchema],
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);
