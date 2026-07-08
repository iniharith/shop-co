"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb+srv://Admin_Harith:nutella210620@cluster0.dcoixot.mongodb.net/shop-co?retryWrites=true&w=majority&appName=Kampungcetak');
        console.log('Connected');
        const Task = mongoose_1.default.connection.db.collection('tasks');
        const FileUpload = mongoose_1.default.connection.db.collection('fileuploads');
        const tasks = yield Task.find({ 'files': { $exists: true, $not: { $size: 0 } } }).toArray();
        let fixedCount = 0;
        for (const task of tasks) {
            if (!task.files || !Array.isArray(task.files))
                continue;
            let needsUpdate = false;
            const newFiles = [];
            for (const f of task.files) {
                if (!f.url)
                    continue;
                const exists = yield FileUpload.findOne({ path: f.url });
                if (!exists) {
                    console.log(`Ghost file found in Task ${task._id}: ${f.url}`);
                    needsUpdate = true;
                }
                else {
                    newFiles.push(f);
                }
            }
            if (needsUpdate) {
                yield Task.updateOne({ _id: task._id }, { $set: { files: newFiles } });
                fixedCount++;
                console.log(`Fixed Task ${task._id}`);
            }
        }
        console.log(`Finished. Fixed ${fixedCount} tasks.`);
        process.exit(0);
    });
}
run();
