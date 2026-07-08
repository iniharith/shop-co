import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Admin_Harith:nutella210620@cluster0.dcoixot.mongodb.net/shop-co?retryWrites=true&w=majority&appName=Kampungcetak');
  console.log('Connected');
  
  const Task = mongoose.connection.db.collection('tasks');
  const FileUpload = mongoose.connection.db.collection('fileuploads');
  
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
  process.exit(0);
}

run();
