/**
 * Coded by Harith
 * Kampungcetak ®
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskComment {
  userId: string;
  userName: string;
  text: string;
  role?: string;
  pinned?: boolean;
  createdAt: Date;
}

export interface ITaskActivity {
  userId: string;
  userName: string;
  action: string;
  details?: string;
  createdAt: Date;
}

export interface ITaskStatusTransition {
  fromStatus: string | null;
  toStatus: string;
  fromIsDone: boolean;
  toIsDone: boolean;
  changedAt: Date;
  estimated?: boolean;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  assignee?: string; // Admin User ID
  dueDate?: Date;
  orderId?: string; // Linked Order ID
  customerUsername?: string; // Linked Customer Username
  category?: string; // e.g. DIGITAL PRINTING, DISPLAY ITEM
  status: 'PLACED' | 'IN_PROGRESS' | 'PENDING_ARTWORK' | 'ARTWORK_REVIEWED' | 'ARTWORK_REJECTED' | 'IN_DESIGN' | 'PEMBETULAN' | 'DONE_DESIGN' | 'IN_PRODUCTION' | 'PRINT_AWB' | 'DONE_PRINTING' | 'PACKAGING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED' | 'RETURN';
  isDone?: boolean;
  isDeleted?: boolean;
  files: { url: string; name: string; notes?: string; tag?: string }[];
  comments: ITaskComment[];
  activities: ITaskActivity[];
  statusHistory: ITaskStatusTransition[];
  statusUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  role: { type: String, default: 'admin' },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const TaskActivitySchema = new Schema<ITaskActivity>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const TaskStatusTransitionSchema = new Schema<ITaskStatusTransition>({
  fromStatus: { type: String, default: null },
  toStatus: { type: String, required: true },
  fromIsDone: { type: Boolean, required: true },
  toIsDone: { type: Boolean, required: true },
  changedAt: { type: Date, required: true },
  estimated: { type: Boolean, default: false },
}, { _id: false });

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assignee: { type: String, default: null }, // Mongoose ObjectId string
    dueDate: { type: Date, default: null },
    orderId: { type: String, default: null },
    customerUsername: { type: String, default: '' },
    category: { type: String, default: 'UNASSIGNED' },
    status: { type: String, enum: ['PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 'IN_PRODUCTION', 'PRINT_AWB', 'DONE_PRINTING', 'PACKAGING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN'], default: 'PLACED' },
    isDone: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    statusUpdatedAt: { type: Date, default: Date.now },
    files: [{
      url: { type: String, required: true },
      name: { type: String, required: true },
      notes: { type: String, default: '' },
      tag: { type: String, enum: ['attachment', 'draft', 'for_print'], default: 'attachment' }
    }],
    comments: [TaskCommentSchema],
    activities: [TaskActivitySchema],
    statusHistory: { type: [TaskStatusTransitionSchema], default: [] },
  },
  { timestamps: true }
);

// Some transactional admin flows create Task documents directly rather than
// through TaskRepository, so establish the initial state at the model boundary.
TaskSchema.pre('validate', function (next) {
  if (this.isNew && this.statusHistory.length === 0) {
    const changedAt = this.statusUpdatedAt || new Date();
    this.statusUpdatedAt = changedAt;
    this.statusHistory.push({
      fromStatus: null,
      toStatus: this.status || 'PLACED',
      fromIsDone: false,
      toIsDone: Boolean(this.isDone),
      changedAt,
    });
  }
  next();
});

TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ updatedAt: -1 });
TaskSchema.index({ updatedAt: -1, _id: -1 });
TaskSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
TaskSchema.index({ assignee: 1, status: 1, createdAt: -1 });
TaskSchema.index({ orderId: 1 });
TaskSchema.index({ isDeleted: 1, 'statusHistory.changedAt': -1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
