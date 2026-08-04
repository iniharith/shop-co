/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { config } from "dotenv";
import mongoose from "mongoose";
import dns from "dns";

// Bypass Telekom Malaysia's broken IPv6 DNS by forcing Google's DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

config();
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://abshar:123@localhost:27017/';
        await mongoose.connect(mongoURI, {
            dbName: 'shop-co',
            authSource: "admin",
            family: 4, // Force IPv4 to bypass dual-stack DNS issues
            serverSelectionTimeoutMS: 5000,
        });

        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error 🔴:", err);
        process.exit(1);
    }
};

export default connectDB;
