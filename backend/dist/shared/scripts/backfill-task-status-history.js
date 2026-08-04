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
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri)
        throw new Error('MONGO_URI is required');
    const apply = process.argv.includes('--apply');
    yield mongoose_1.default.connect(mongoUri, {
        dbName: process.env.MONGO_DB_NAME || 'shop-co',
        serverSelectionTimeoutMS: 10000,
    });
    const tasks = mongoose_1.default.connection.collection('tasks');
    const missingHistory = {
        $or: [
            { statusHistory: { $exists: false } },
            { statusHistory: { $size: 0 } },
        ],
    };
    const count = yield tasks.countDocuments(missingHistory);
    if (!apply) {
        console.log(`Dry run: ${count} task(s) need an initial status-history entry.`);
        console.log('Run with --apply to update them.');
        return;
    }
    const result = yield tasks.updateMany(missingHistory, [{
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
        }]);
    console.log(`Backfilled ${result.modifiedCount} of ${count} task(s).`);
});
run()
    .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
})
    .finally(() => mongoose_1.default.disconnect().catch(() => undefined));
