import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');

  await mongoose.connect(mongoUri);
  console.log('Connected');
  
  const Task = mongoose.connection.db!.collection('tasks');
  const FileUpload = mongoose.connection.db!.collection('fileuploads');
  
  const tasks = await Task.find({ 'files': { $exists: true, $not: { $size: 0 } } }).toArray();
  let fixedCount = 0;
  
  for (const task of tasks) {
    if (!task.files || !Array.isArray(task.files)) continue;
    
    let needsUpdate = false;
    const newFiles = [];
    
    for (const f of task.files) {
      if (!f.url) continue;
      const exists = await FileUpload.findOne({ path: f.url });
      if (!exists) {
        console.log(`Ghost file found in Task ${task._id}: ${f.url}`);
        needsUpdate = true;
      } else {
        newFiles.push(f);
      }
    }
    
    if (needsUpdate) {
      await Task.updateOne({ _id: task._id }, { $set: { files: newFiles } });
      fixedCount++;
      console.log(`Fixed Task ${task._id}`);
    }
  }
  
  console.log(`Finished. Fixed ${fixedCount} tasks.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
