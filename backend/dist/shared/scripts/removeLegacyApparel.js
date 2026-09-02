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
const dotenv_1 = require("dotenv");
const db_config_1 = __importDefault(require("../../config/db.config"));
const product_model_1 = __importDefault(require("../../infrastructure/db/models/product.model"));
const redis_1 = require("../../infrastructure/redis/redis");
const redis_constant_1 = require("../constants/redis.constant");
const names = [
    'Brown Shirt',
    'Green Shirt',
    'Jacket',
    'Liquid - TShirt',
    'Black Skull Pant',
    'Gray Skull Pant',
    'Pink Shirt',
    'Salty - TShirt',
];
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    (0, dotenv_1.config)();
    yield (0, db_config_1.default)();
    const result = yield product_model_1.default.updateMany({ name: { $in: names } }, { $set: { isDelete: true } });
    const redis = new redis_1.RedisService();
    yield redis.delByPrefix(redis_constant_1.REDIS_KEYS.PRODUCTS);
    yield redis.del(redis_constant_1.REDIS_KEYS.CATEGORIES);
    console.log(`Soft-deleted ${result.modifiedCount} legacy products.`);
    process.exit(0);
});
main().catch((error) => {
    console.error('Legacy product removal failed:', error);
    process.exit(1);
});
