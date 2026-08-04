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
/**
 * Coded by Harith
 * Kampungcetak ®
 */
const dotenv_1 = require("dotenv");
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
// Bypass Telekom Malaysia's broken IPv6 DNS by forcing Google's DNS
dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
(0, dotenv_1.config)();
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://abshar:123@localhost:27017/';
        yield mongoose_1.default.connect(mongoURI, {
            dbName: 'shop-co',
            authSource: "admin",
            family: 4, // Force IPv4 to bypass dual-stack DNS issues
            serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB connected");
    }
    catch (err) {
        console.error("MongoDB connection error 🔴:", err);
        process.exit(1);
    }
});
exports.default = connectDB;
