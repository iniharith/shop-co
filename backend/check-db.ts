import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

const TaskSchema = new mongoose.Schema({
  title: String,
  status: String,
  assignee: mongoose.Schema.Types.ObjectId,
  activities: [
    {
      userId: String,
      userName: String,
      action: String,
      details: String,
      createdAt: Date,
    }
  ],
  createdAt: Date,
  updatedAt: Date
}, { strict: false });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function checkTasks() {
  if (!MONGO_URI) throw new Error('MONGO_URI is required');
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  
  const tasks = await Task.find({
    title: { $regex: /raven61763|miszyaya88|aiendelisya1/i }
  }).lean();

  for (const t of tasks) {
    console.log(`\n=== Task: ${t.title} ===`);
    console.log(`CreatedAt: ${t.createdAt}`);
    console.log(`UpdatedAt: ${t.updatedAt}`);
    console.log(`Assignee: ${t.assignee}`);
    console.log("Activities:");
    if (!t.activities || t.activities.length === 0) {
       console.log(" - No activities found.");
    } else {
       t.activities.forEach((a: any) => {
         console.log(` - [${a.createdAt}] ${a.userName}: ${a.action}`);
       });
    }
  }
  
  await mongoose.disconnect();
}

checkTasks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
